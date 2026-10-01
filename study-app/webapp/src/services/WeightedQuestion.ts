/**
 * A question tagged with its domain and a selection weight - higher weight means it should be
 * preferred when a domain has more candidates than its quota allows.
 */
export interface WeightedQuestion {
  readonly index: number;
  readonly domain: string;
  readonly weight: number;
}
