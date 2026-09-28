"use client";

/**
 * A text input with a dropdown of suggestions (ARIA combobox pattern),
 * shared by the app search and the website boxes.
 *
 *  - Arrow keys move through suggestions, Enter picks the highlighted one
 *    (with nothing highlighted, Enter submits the surrounding form as
 *    normal), Escape closes the list.
 *  - Tapping a suggestion picks it; big touch targets for phones.
 *  - The parent owns the value and the suggestions list, so it decides
 *    where suggestions come from (a local list or a search request).
 *
 * UNTRUSTED DATA: titles/subtitles may come from outside sources and are
 * rendered as plain text; icon URLs must already be checked by the caller.
 * CLIENT-ONLY. Contains no secrets.
 */

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

export interface Suggestion {
  key: string;
  title: string;
  subtitle?: string | null;
  /** https image URL already checked by the caller, or null for a letter tile. */
  iconUrl?: string | null;
}

function Icon({ s }: { s: Suggestion }) {
  const [failed, setFailed] = useState(false);
  if (s.iconUrl && !failed) {
    return (
      <img
        src={s.iconUrl}
        alt=""
        width={32}
        height={32}
        loading="lazy"
        className="h-8 w-8 shrink-0 rounded-lg border border-line object-cover"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span className="h-8 w-8 shrink-0 rounded-lg bg-line flex items-center justify-center font-display text-sm font-bold text-ink">
      {s.title.charAt(0).toUpperCase()}
    </span>
  );
}

export default function SuggestInput({
  id,
  label,
  value,
  onChange,
  onPick,
  suggestions,
  loading = false,
  emptyText = null,
  placeholder,
  inputMode = "text",
  invalid = false,
  describedBy,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onPick: (s: Suggestion) => void;
  suggestions: Suggestion[];
  loading?: boolean;
  /** Shown in the dropdown when there are no suggestions and not loading (null hides the dropdown). */
  emptyText?: string | null;
  placeholder: string;
  inputMode?: "text" | "url" | "search";
  invalid?: boolean;
  describedBy?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = id + "-list";

  useEffect(() => {
    setActive(-1);
  }, [suggestions]);

  useEffect(() => {
    function onDown(e: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  const hasList = suggestions.length > 0;
  const showEmpty = !hasList && !loading && emptyText !== null && value.trim().length > 0;
  const visible = open && (hasList || loading || showEmpty);

  function pick(s: Suggestion) {
    setOpen(false);
    setActive(-1);
    onPick(s);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && hasList) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp" && hasList) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && visible && active >= 0 && suggestions[active]) {
      e.preventDefault();
      pick(suggestions[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className="relative min-w-0 flex-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={visible}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={visible && active >= 0 ? id + "-opt-" + active : undefined}
        inputMode={inputMode}
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-signal"
      />
      <ul
        id={listId}
        role="listbox"
        aria-label={label + " suggestions"}
        className={
          visible
            ? "absolute left-0 right-0 top-full z-30 mt-1 max-h-80 overflow-y-auto rounded-xl border border-line bg-surface py-1 shadow-lg"
            : "hidden"
        }
      >
        {suggestions.map((s, i) => (
          <li
            key={s.key}
            id={id + "-opt-" + i}
            role="option"
            aria-selected={i === active}
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => pick(s)}
            onPointerEnter={() => setActive(i)}
            className={"flex cursor-pointer items-center gap-3 px-3 py-2.5 " + (i === active ? "bg-line/60" : "")}
          >
            <Icon s={s} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-ink">{s.title}</span>
              {s.subtitle && <span className="block truncate text-xs text-muted">{s.subtitle}</span>}
            </span>
          </li>
        ))}
        {loading && !hasList && (
          <li className="px-3 py-3 text-sm text-muted" aria-live="polite">
            Searching…
          </li>
        )}
        {showEmpty && <li className="px-3 py-3 text-sm text-muted">{emptyText}</li>}
      </ul>
    </div>
  );
}
