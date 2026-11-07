"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchItem {
  title: string;
  subtitle: string;
  href: string;
}

interface SearchGroup {
  type: string;
  label: string;
  items: SearchItem[];
}

const HISTORY_KEY = "npl-search-history";

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable;
}

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const flat = groups.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })));

  const readHistory = useCallback(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory((JSON.parse(raw) as string[]).slice(0, 5));
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      } else if (event.key === "/" && !isEditable(event.target)) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    // Reading localStorage is an external-system sync; state is updated from that snapshot.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    readHistory();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => {
      document.body.style.overflow = previous;
      window.clearTimeout(timer);
    };
  }, [open, readHistory]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGroups([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
          headers: { accept: "application/json" },
        });
        const payload = (await response.json()) as { groups?: SearchGroup[] };
        setGroups(payload.groups ?? []);
        setActiveIndex(0);
      } catch {
        if (!controller.signal.aborted) setGroups([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, open]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setGroups([]);
    setActiveIndex(0);
  }, []);

  const go = useCallback(
    (href: string, term: string) => {
      if (term.trim().length >= 2) {
        try {
          const next = [term.trim(), ...history.filter((item) => item !== term.trim())].slice(0, 5);
          localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        } catch {
          // Storage can be unavailable; search still works.
        }
      }
      close();
      router.push(href);
    },
    [close, history, router],
  );

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(0, flat.length - 1)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(0, index - 1));
    } else if (event.key === "Enter") {
      const item = flat[activeIndex];
      if (item) {
        event.preventDefault();
        go(item.href, query);
      }
    } else if (event.key === "Escape") {
      close();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search players, teams, matches and news"
        aria-haspopup="dialog"
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="ml-1 hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground lg:inline">
          ⌘K
        </kbd>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-start justify-center p-4 pt-[10vh] sm:pt-[14vh]" role="dialog" aria-modal="true" aria-label="Site search">
          <button type="button" aria-label="Close search" className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]" onClick={close} />
          <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
            <div className="flex items-center gap-2 border-b border-border px-4">
              <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Search players, teams, matches, news…"
                aria-label="Search"
                role="combobox"
                aria-expanded={flat.length > 0}
                aria-controls="search-results"
                aria-activedescendant={flat[activeIndex] ? `search-result-${activeIndex}` : undefined}
                autoComplete="off"
                className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Searching" /> : null}
              <button
                type="button"
                onClick={close}
                aria-label="Close search"
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div id="search-results" role="listbox" aria-label="Search results" className="max-h-[55vh] overflow-y-auto">
              {query.trim().length < 2 ? (
                <div className="p-4">
                  {history.length > 0 ? (
                    <div className="mb-4">
                      <p className="eyebrow mb-2">Recent searches</p>
                      <div className="flex flex-wrap gap-1.5">
                        {history.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setQuery(item)}
                            className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <p className="eyebrow mb-2">Quick links</p>
                  <div className="grid gap-1 sm:grid-cols-2">
                    {[
                      { href: "/live", label: "Live scores" },
                      { href: "/points-table", label: "Points table" },
                      { href: "/fixtures", label: "Fixtures" },
                      { href: "/teams", label: "Teams" },
                    ].map((link) => (
                      <button
                        key={link.href}
                        type="button"
                        onClick={() => go(link.href, "")}
                        className="rounded-md px-2.5 py-2 text-left text-sm text-foreground hover:bg-muted"
                      >
                        {link.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : flat.length === 0 && !loading ? (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm font-medium">No results for “{query}”</p>
                  <p className="mt-1 text-xs text-muted-foreground">Try a team, player, venue or headline.</p>
                </div>
              ) : (
                groups.map((group) => (
                  <div key={group.type} className="border-b border-border py-2 last:border-0">
                    <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{group.label}</p>
                    {group.items.map((item) => {
                      const index = flat.findIndex((row) => row.href === item.href && row.title === item.title);
                      return (
                        <button
                          key={`${group.type}-${item.href}-${item.title}`}
                          id={`search-result-${index}`}
                          type="button"
                          role="option"
                          aria-selected={index === activeIndex}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => go(item.href, query)}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left",
                            index === activeIndex ? "bg-primary/5" : "hover:bg-muted",
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-foreground">{item.title}</span>
                            <span className="block truncate text-[11px] text-muted-foreground">{item.subtitle}</span>
                          </span>
                          {index === activeIndex ? <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" /> : null}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-2 text-[10px] text-muted-foreground">
              <span>↑ ↓ to navigate · Enter to open · Esc to close</span>
              <span>NPL Cricket Hub search</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
