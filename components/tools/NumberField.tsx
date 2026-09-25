"use client";

/**
 * A labelled number input for the calculator tools, with an optional unit
 * suffix (e.g. "$", "%") and helper text. Keeps its value as a string so
 * the field can be empty while typing rather than snapping to 0.
 * No data or security logic.
 */

export default function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  help,
  min = 0,
  step = "any",
  id,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
  help?: string;
  min?: number;
  step?: string;
  id: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink mb-1">
        {label}
      </label>
      <div className="flex items-stretch rounded-xl border border-line bg-surface focus-within:ring-2 focus-within:ring-signal overflow-hidden">
        {prefix && <span className="flex items-center pl-3 text-muted text-sm">{prefix}</span>}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 bg-transparent px-3 py-2.5 text-ink outline-none"
        />
        {suffix && <span className="flex items-center pr-3 text-muted text-sm">{suffix}</span>}
      </div>
      {help && <p className="mt-1 text-xs text-muted">{help}</p>}
    </div>
  );
}
