import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 76 legal balls -> "12.4" */
export function oversFromBalls(legalBalls: number): string {
  if (legalBalls <= 0) return "0.0";
  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;
  return `${overs}.${balls}`;
}

export function ballsFromOvers(overs: number): number {
  return Math.round(overs * 6);
}

export function runRate(runs: number, legalBalls: number): number {
  if (legalBalls <= 0) return 0;
  return (runs * 6) / legalBalls;
}

export function strikeRate(runs: number, balls: number): number {
  if (balls <= 0) return 0;
  return (runs / balls) * 100;
}

export function economy(runsConceded: number, legalBalls: number): number {
  if (legalBalls <= 0) return 0;
  return (runsConceded * 6) / legalBalls;
}

export function average(runs: number, dismissals: number): number {
  if (dismissals <= 0) return 0;
  return runs / dismissals;
}

export function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function formatNumber(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(decimals);
}

export function formatNrr(value: number): string {
  const fixed = value.toFixed(3);
  return value > 0 ? `+${fixed}` : fixed;
}

export function formatDateUTC(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

/** All match times are stored in UTC and presented in Asia/Kathmandu (UTC+05:45). */
export function formatKathmanduTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kathmandu",
  }).format(new Date(iso));
}

export function formatKathmanduDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kathmandu",
  }).format(new Date(iso));
}

export function formatKathmanduDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kathmandu",
  }).format(new Date(iso));
}

export function relativeTime(iso: string, now = new Date()): string {
  const then = new Date(iso).getTime();
  const diff = now.getTime() - then;
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDateUTC(iso);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function truncate(value: string, max = 160): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

export function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}
