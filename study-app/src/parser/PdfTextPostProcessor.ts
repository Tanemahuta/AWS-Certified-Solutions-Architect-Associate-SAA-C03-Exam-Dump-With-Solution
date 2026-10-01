const unicodeReplacements = new Map<string, string>([
  ["ﬀ", "ff"],
  ["ﬁ", "fi"],
  ["ﬂ", "fl"],
  ["ﬃ", "ffi"],
  ["ﬄ", "ffl"],
  ["ﬅ", "st"],
  ["ﬆ", "st"],
  ["–", "-"],
  ["—", "-"],
  ["‘", "'"],
  ["’", "'"],
  ["“", '"'],
  ["”", '"'],
  ["•", "*"],
  ["→", "->"],
  ["✅", " OK "],
  ["Е", "E"],
  ["…", "..."],
]);
const forwardChars= [
  '\u2264'
]


export class PdfTextPostProcessor {
  public process(text: string): string {
    let processed = text.normalize("NFKC");

    for (const [from, to] of unicodeReplacements) {
      processed = processed.replaceAll(from, to);
    }

    const unhandled = [...new Set([...processed].filter((char) => forwardChars.indexOf(char) === -1 && char.codePointAt(0)! > 127))];
    if (unhandled.length > 0) {
      const details = unhandled.map((char) => `U+${char.codePointAt(0)!.toString(16).toUpperCase()}`).join(", ");
      throw new Error(`Unhandled non-ASCII Unicode characters in PDF text: ${details}`);
    }

    return processed;
  }
}
