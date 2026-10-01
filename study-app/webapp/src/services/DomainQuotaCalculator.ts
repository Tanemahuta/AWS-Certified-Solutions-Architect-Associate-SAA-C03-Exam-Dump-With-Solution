import type { WeightedQuestion } from "./WeightedQuestion";

/**
 * Official AWS Certified Solutions Architect - Associate (SAA-C03) exam guide content domain
 * weightings. Question selection quotas are derived from these fixed percentages, not from how
 * many questions happen to exist per domain in the local question pool.
 */
export const AWS_DOMAIN_WEIGHTS: Record<string, number> = {
  "Design Secure Architectures": 0.30,
  "Design Resilient Architectures": 0.26,
  "Design High-Performing Architectures": 0.24,
  "Design Cost-Optimized Architectures": 0.20,
};

/**
 * Second pipeline stage: computes how many questions to draw from each domain for a session of
 * `amount` questions, using the fixed {@link AWS_DOMAIN_WEIGHTS} percentages rather than the
 * pool's per-domain proportions. When a domain's pool is too small to satisfy its weighted quota,
 * the shortfall is redistributed (by weight, largest-remainder first) across the remaining
 * domains that still have spare questions, one round at a time until `amount` is met or every
 * pool is exhausted.
 */
export class DomainQuotaCalculator {
  public constructor(private readonly domainWeights: Record<string, number> = AWS_DOMAIN_WEIGHTS) {}

  public quotasFor(questions: readonly WeightedQuestion[], amount: number): Map<string, number> {
    const available = new Map<string, number>();
    questions.forEach(({ domain }) => available.set(domain, (available.get(domain) ?? 0) + 1));

    const quota = new Map<string, number>([...available.keys()].map((domain) => [domain, 0]));
    const totalAvailable = [...available.values()].reduce((sum, count) => sum + count, 0);
    let remaining = Math.min(amount, totalAvailable);

    while (remaining > 0) {
      const open = [...available.entries()].filter(([domain, count]) => count > (quota.get(domain) ?? 0));
      if (open.length === 0) break;

      const totalWeight = open.reduce((sum, [domain]) => sum + this.weight(domain, open.length), 0);
      const shares = open.map(([domain, count]) => {
        const room = count - (quota.get(domain) ?? 0);
        const share = Math.min(room, (remaining * this.weight(domain, open.length)) / totalWeight);
        return { domain, room, floor: Math.floor(share), remainder: share - Math.floor(share) };
      });

      shares.forEach(({ domain, floor }) => quota.set(domain, (quota.get(domain) ?? 0) + floor));
      remaining -= shares.reduce((sum, { floor }) => sum + floor, 0);

      // Hand out any leftover (due to rounding, or every share flooring to zero) one-by-one,
      // largest fractional remainder first, to domains that still have room.
      for (const { domain, room, floor } of [...shares].sort((left, right) => right.remainder - left.remainder)) {
        if (remaining === 0) break;
        if (room - floor <= 0) continue;
        quota.set(domain, (quota.get(domain) ?? 0) + 1);
        remaining--;
      }
    }
    return quota;
  }

  private weight(domain: string, domainCount: number): number {
    return this.domainWeights[domain] ?? 1 / domainCount;
  }
}
