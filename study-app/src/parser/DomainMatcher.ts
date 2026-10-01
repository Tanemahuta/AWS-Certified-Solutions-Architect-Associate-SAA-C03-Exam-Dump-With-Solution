import domains from "../domains.json" with { type: "json" };

export interface DomainMatch {
  readonly domain: string;
  readonly score: number;
  readonly matches: number;
}

type DomainCatalog = Record<string, readonly string[]>;

export class DomainMatcher {
  public constructor(
    private readonly catalog: DomainCatalog = domains,
    private readonly minimumHit = 0.8,
  ) {}

  public match(question: string, questionNumber: number): string {
    const tokens = this.tokens(question);
    const matches = Object.entries(this.catalog).map(([domain, keywords]) => {
      const hits = keywords.reduce((total, keyword) => {
        const keywordTokens = this.tokens(keyword);
        const matched = keywordTokens.filter((token) => tokens.includes(token)).length;
        return total + (matched === keywordTokens.length ? matched * 10 : matched / keywordTokens.length);
      }, 0);
      return { domain, score: hits, matches: hits };
    }).filter((match) => match.score > 0);
    if (matches.length === 0) throw new Error(`Question ${questionNumber} could not be assigned to a domain (hit below ${this.minimumHit * 100}%).`);
    const maximum = Math.max(...matches.map((match) => match.score));
    const winners = matches.filter((match) => match.score === maximum);
    if (winners.length !== 1 && maximum >= 2) throw new Error(`Question ${questionNumber} has tied domains: ${winners.map((match) => match.domain).join(", ")}.`);
    return winners[0].domain;
  }

  private tokens(value: string): string[] {
    return value.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  }
}
