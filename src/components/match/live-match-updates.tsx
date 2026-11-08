"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

type ConnectionState = "connecting" | "realtime" | "polling";

const SAFETY_POLL_MS = 60_000;
const FALLBACK_POLL_MS = 20_000;
const REFRESH_DEBOUNCE_MS = 350;

/**
 * Live match updates.
 *
 * - Supabase Realtime: one channel per match, subscribed to `match_events_log`
 *   filtered by `match_id`, so a visitor never receives other matches' traffic.
 * - Reconnection: supabase-js reconnects automatically; on CHANNEL_ERROR or
 *   TIMED_OUT we tear the channel down and resubscribe with exponential backoff.
 * - Duplicate protection: event ids are de-duplicated and refreshes are debounced,
 *   so a burst of ball events causes one server render, not one per event.
 * - Graceful degradation: without Supabase credentials (demo mode) or if realtime
 *   keeps failing, the page polls instead of going stale.
 */
export function LiveMatchUpdates({ matchId, live }: { matchId: string; live: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<ConnectionState>("connecting");
  const [lastEventAt, setLastEventAt] = useState<number | null>(null);
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!live) return;

    const supabase = getBrowserSupabaseClient();
    let cancelled = false;
    let channel: RealtimeChannel | null = null;
    let refreshTimer: number | undefined;
    let pollTimer: number | undefined;
    let retryTimer: number | undefined;
    let attempt = 0;

    const refresh = () => {
      if (refreshTimer) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        if (!cancelled) router.refresh();
      }, REFRESH_DEBOUNCE_MS);
    };

    const startFallbackPolling = () => {
      if (pollTimer) return;
      setState("polling");
      pollTimer = window.setInterval(() => {
        if (!cancelled) router.refresh();
      }, FALLBACK_POLL_MS);
    };

    if (!supabase) {
      startFallbackPolling();
      return () => {
        cancelled = true;
        if (pollTimer) window.clearInterval(pollTimer);
        if (refreshTimer) window.clearTimeout(refreshTimer);
      };
    }

    const subscribe = () => {
      if (cancelled) return;
      setState((current) => (current === "realtime" ? current : "connecting"));
      channel = supabase.channel(`match:${matchId}`, {
        config: { broadcast: { self: false } },
      });

      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "match_events_log",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          if (cancelled) return;
          const row = (payload.new ?? payload.old) as { id?: string } | null;
          const eventId = row?.id;
          if (eventId) {
            if (seenRef.current.has(eventId)) return;
            seenRef.current.add(eventId);
            if (seenRef.current.size > 500) {
              // Keep the de-dupe set bounded on long live matches.
              const first = seenRef.current.values().next().value;
              if (first) seenRef.current.delete(first);
            }
          }
          setLastEventAt(Date.now());
          refresh();
        },
      );

      channel.subscribe((status) => {
        if (cancelled) return;
        if (status === "SUBSCRIBED") {
          attempt = 0;
          setState("realtime");
          if (pollTimer) {
            window.clearInterval(pollTimer);
            pollTimer = undefined;
          }
          return;
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          startFallbackPolling();
          if (retryTimer) window.clearTimeout(retryTimer);
          attempt += 1;
          const delay = Math.min(30_000, 1_000 * 2 ** Math.min(attempt, 5));
          retryTimer = window.setTimeout(() => {
            if (cancelled) return;
            if (channel) {
              void supabase.removeChannel(channel);
              channel = null;
            }
            subscribe();
          }, delay);
        }
      });
    };

    subscribe();

    // Safety net: even when realtime is healthy, a slow poll catches a silently
    // dead socket during the highest-traffic moments.
    const safetyPoll = window.setInterval(() => {
      if (!cancelled) router.refresh();
    }, SAFETY_POLL_MS);

    return () => {
      cancelled = true;
      if (refreshTimer) window.clearTimeout(refreshTimer);
      if (pollTimer) window.clearInterval(pollTimer);
      if (retryTimer) window.clearTimeout(retryTimer);
      window.clearInterval(safetyPoll);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [live, matchId, router]);

  if (!live) return null;

  const label =
    state === "realtime"
      ? "Realtime connected"
      : state === "polling"
        ? "Realtime unavailable · refreshing"
        : "Connecting live updates…";

  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground"
      data-testid="live-updates-status"
      data-state={state}
      title={lastEventAt ? `Last event received ${new Date(lastEventAt).toLocaleTimeString()}` : undefined}
    >
      <span
        aria-hidden="true"
        className={
          state === "realtime"
            ? "h-1.5 w-1.5 animate-pulse rounded-full bg-live"
            : state === "polling"
              ? "h-1.5 w-1.5 rounded-full bg-accent"
              : "h-1.5 w-1.5 rounded-full bg-muted-foreground"
        }
      />
      {label}
    </span>
  );
}
