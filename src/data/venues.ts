export const venueOptions = ["PADMA", "SONCHAFA"] as const;

export function normalizeVenueName(venue?: string) {
  if (venue === "Phase 1") return "PADMA";
  if (venue === "Phase 2") return "SONCHAFA";
  return venue ?? "";
}
