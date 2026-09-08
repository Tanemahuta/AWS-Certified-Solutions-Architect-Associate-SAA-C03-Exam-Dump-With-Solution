import { PdfTextPostProcessor } from "./PdfTextPostProcessor";

describe("PdfTextPostProcessor", () => {
  it("converts Unicode typographic ligatures", () => {
    expect(new PdfTextPostProcessor().process("ﬀ ﬁ ﬂ ﬃ ﬄ ﬅ ﬆ")).toBe("ff fi fl ffi ffl st st");
  });

  it("normalizes OCR punctuation and quote artifacts", () => {
    expect(new PdfTextPostProcessor().process("The company’s data — and “quoted” text •")).toBe("The company's data - and \"quoted\" text *");
  });

  it("fails when a non-ASCII character is not explicitly handled", () => {
    expect(() => new PdfTextPostProcessor().process("Unhandledé")).toThrow(/Unhandled non-ASCII Unicode/);
  });
});
