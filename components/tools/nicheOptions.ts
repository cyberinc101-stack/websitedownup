/** Niche dropdown options shared by the calculator tools. CLIENT-SAFE. */
import { GENERAL_NICHE, NICHES } from "@/data/worth/niches";

export const NICHE_OPTIONS = [...NICHES, GENERAL_NICHE].map((n) => ({ value: n.id, label: n.label }));

export function nicheRpmMid(nicheId: string): number {
  const niche = [...NICHES, GENERAL_NICHE].find((n) => n.id === nicheId) ?? GENERAL_NICHE;
  return (niche.rpm[0] + niche.rpm[1]) / 2;
}

export function nicheRpmRange(nicheId: string): [number, number] {
  const niche = [...NICHES, GENERAL_NICHE].find((n) => n.id === nicheId) ?? GENERAL_NICHE;
  return niche.rpm;
}

/** Typical paid-search CPC for the niche (distinct from display RPM). */
export function nicheSearchCpcMid(nicheId: string): number {
  const niche = [...NICHES, GENERAL_NICHE].find((n) => n.id === nicheId) ?? GENERAL_NICHE;
  return (niche.searchCpc[0] + niche.searchCpc[1]) / 2;
}
