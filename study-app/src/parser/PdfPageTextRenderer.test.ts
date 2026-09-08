import { renderPdfPage, type PdfPageData } from "./PdfPageTextRenderer";

describe("renderPdfPage", () => {
  it("decodes null PDF glyphs by their ligature widths", async () => {
    const page: PdfPageData = {
      getTextContent: async () => ({
        items: [
          { str: "a ", width: 1, transform: [0, 0, 0, 0, 0, 1] },
          { str: "\u0000", width: 5.882809619382731, transform: [0, 0, 0, 0, 0, 1] },
          { str: "le", width: 1, transform: [0, 0, 0, 0, 0, 1] },
          { str: "\u0000", width: 8.935542499560421, transform: [0, 0, 0, 0, 0, 2] },
          { str: "c", width: 1, transform: [0, 0, 0, 0, 0, 2] },
          { str: "\u0000", width: 6.05273141117765, transform: [0, 0, 0, 0, 0, 2] },
          { str: "ow", width: 1, transform: [0, 0, 0, 0, 0, 2] },
        ],
      }),
    };

    await expect(renderPdfPage(page)).resolves.toBe("a file\nfficflow");
  });

  it("rejects unknown null glyph widths", async () => {
    const page: PdfPageData = {
      getTextContent: async () => ({
        items: [{ str: "\u0000", width: 1, transform: [0, 0, 0, 0, 0, 1] }],
      }),
    };

    await expect(renderPdfPage(page)).rejects.toThrow("Unhandled PDF ligature glyph width: 1");
  });
});
