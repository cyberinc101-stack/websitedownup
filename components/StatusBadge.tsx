type State = "up" | "down" | "checking";

const STYLES: Record<State, { bg: string; text: string; dot: string; label: string }> = {
  up: { bg: "bg-up-bg", text: "text-up", dot: "bg-up", label: "Up" },
  down: { bg: "bg-down-bg", text: "text-down", dot: "bg-down", label: "Down" },
  checking: { bg: "bg-signal-light", text: "text-signal-dark", dot: "bg-signal", label: "Checking" },
};

export default function StatusBadge({ state }: { state: State }) {
  const s = STYLES[state];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.bg} ${s.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot} ${state === "checking" ? "animate-pulseDot" : ""}`} />
      {s.label}
    </span>
  );
}
