import { normalize } from "./Text.js";
import type { SourceSection } from "./SourceSection.js";

export class SectionParser {
  public constructor(private readonly startPattern: RegExp, private readonly topicGroup = 0, private readonly numberGroup = 1, private readonly contentGroup = 2) {}

  public parse(text: string): SourceSection[] {
    const result: SourceSection[] = [];
    let current: SourceSection | undefined;
    for (const line of text.replace(/\r/g, "").split("\n")) {
      const match = line.match(this.startPattern);
      if (match && !Number.isNaN(Number(match[this.numberGroup]))) {
        current = { number: Number(match[this.numberGroup]), topic: this.topicGroup ? match[this.topicGroup] : undefined, lines: [normalize(match[this.contentGroup] ?? "")] };
        result.push(current);
      } else if (current) {
        current.lines.push(line.trim());
      }
    }
    return result;
  }
}
