"use client";

/**
 * Saved sites: local to this browser only, no accounts or backend.
 * Stores up to MAX_SAVED domains in localStorage, each with its own
 * alert on/off flag. components/AlertWatcher.tsx reads the alert flags
 * to decide what to poll; app/saved/page.tsx and SaveButton read/write
 * this store via the useSavedSites() hook.
 * CLIENT-ONLY. Contains no secrets.
 */

import { useSyncExternalStore } from "react";

export interface SavedSite {
  domain: string;
  addedAt: string;
  alert: boolean;
}

export const MAX_SAVED = 50;
const KEY = "isSiteUp:savedSites:v1";

type Listener = () => void;
const listeners = new Set<Listener>();
let cache: SavedSite[] | null = null;

// Fixed empty-array reference. useSyncExternalStore compares snapshots by
// reference, so getServerSnapshot must return the *same* array instance
// every call -- a new [] literal here causes an infinite re-render loop.
const EMPTY_SITES: SavedSite[] = [];

function read(): SavedSite[] {
  if (typeof window === "undefined") return EMPTY_SITES;
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as SavedSite[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: SavedSite[]) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked (private mode); this tab still updates in memory.
  }
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  // Keeps other open tabs in sync when one tab saves/removes a site.
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      cache = null;
      listeners.forEach((l) => l());
    }
  });
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): SavedSite[] {
  return read();
}

function getServerSnapshot(): SavedSite[] {
  return EMPTY_SITES;
}

export function toggleSave(domain: string): boolean {
  const list = read();
  if (list.some((s) => s.domain === domain)) {
    write(list.filter((s) => s.domain !== domain));
    return false;
  }
  if (list.length >= MAX_SAVED) return false;
  write([...list, { domain, addedAt: new Date().toISOString(), alert: false }]);
  return true;
}

export function removeSaved(domain: string) {
  write(read().filter((s) => s.domain !== domain));
}

export function toggleAlert(domain: string): boolean {
  const list = read();
  const site = list.find((s) => s.domain === domain);
  if (!site) return false;
  const next = !site.alert;
  write(list.map((s) => (s.domain === domain ? { ...s, alert: next } : s)));
  return next;
}

export function useSavedSites() {
  const sites = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    sites,
    count: sites.length,
    isSaved: (domain: string) => sites.some((s) => s.domain === domain),
    isAlerting: (domain: string) => sites.some((s) => s.domain === domain && s.alert),
    toggleSave,
    toggleAlert,
    removeSaved,
  };
}
