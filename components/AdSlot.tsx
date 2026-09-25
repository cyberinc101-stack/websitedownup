/**
 * Placeholder ad container. Swap the inner placeholder div for your real
 * AdSense <ins class="adsbygoogle"> unit once your publisher ID is approved.
 * Kept visually separated and labeled "Advertisement" per AdSense policy,
 * which requires ads to be clearly distinguishable from page content.
 */
export default function AdSlot({
  className = "",
  label = "Advertisement",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <span className="text-[10px] uppercase tracking-wider text-muted/70 mb-1.5 shrink-0">
        {label}
      </span>
      <div className="flex-1 w-full min-h-[100px] rounded-lg border border-dashed border-line bg-white/60 flex items-center justify-center text-xs text-muted/60">
        {/* Replace this div with your <ins class="adsbygoogle"> tag */}
        Ad slot
      </div>
    </div>
  );
}