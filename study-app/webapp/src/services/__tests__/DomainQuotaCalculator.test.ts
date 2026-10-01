import type { WeightedQuestion } from "../WeightedQuestion";
import { DomainQuotaCalculator } from "../DomainQuotaCalculator";

function weightedQuestions(domainCounts: Record<string, number>): WeightedQuestion[] {
  let index = 0;
  return Object.entries(domainCounts).flatMap(([domain, count]) =>
    Array.from({ length: count }, () => ({ index: index++, domain, weight: 0 })),
  );
}

describe("DomainQuotaCalculator", () => {
  const abundantPool = weightedQuestions({
    "Design Secure Architectures": 200,
    "Design Resilient Architectures": 200,
    "Design High-Performing Architectures": 200,
    "Design Cost-Optimized Architectures": 200,
  });

  it("splits a 100-question session by the official AWS domain percentages when the pool is abundant", () => {
    const quotas = new DomainQuotaCalculator().quotasFor(abundantPool, 100);
    expect(Object.fromEntries(quotas)).toMatchSnapshot();
  });

  it("always allocates exactly `amount` questions when enough are available", () => {
    const quotas = new DomainQuotaCalculator().quotasFor(abundantPool, 65);
    const total = [...quotas.values()].reduce((sum, count) => sum + count, 0);
    expect(total).toBe(65);
  });

  it("caps a domain's quota at its pool size and redistributes the shortfall to other domains", () => {
    const smallSecure = weightedQuestions({
      "Design Secure Architectures": 2,
      "Design Resilient Architectures": 200,
      "Design High-Performing Architectures": 200,
      "Design Cost-Optimized Architectures": 200,
    });
    const quotas = new DomainQuotaCalculator().quotasFor(smallSecure, 65);
    expect(quotas.get("Design Secure Architectures")).toBe(2);
    const total = [...quotas.values()].reduce((sum, count) => sum + count, 0);
    expect(total).toBe(65);
    expect(Object.fromEntries(quotas)).toMatchSnapshot();
  });

  it("never asks for more questions than are available across every domain", () => {
    const tinyPool = weightedQuestions({
      "Design Secure Architectures": 1,
      "Design Resilient Architectures": 1,
    });
    const quotas = new DomainQuotaCalculator().quotasFor(tinyPool, 65);
    const total = [...quotas.values()].reduce((sum, count) => sum + count, 0);
    expect(total).toBe(2);
  });

  it("falls back to an even split for domains missing from the fixed weight table", () => {
    const unknownDomains = weightedQuestions({ "Some New Domain": 10, "Another New Domain": 10 });
    const quotas = new DomainQuotaCalculator().quotasFor(unknownDomains, 10);
    expect(quotas.get("Some New Domain")).toBe(5);
    expect(quotas.get("Another New Domain")).toBe(5);
  });
});
