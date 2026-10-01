interface PdfTextItem {
  readonly str: string;
  readonly width: number;
  readonly transform: readonly number[];
}

interface PdfTextContent {
  readonly items: readonly PdfTextItem[];
}

export interface PdfPageData {
  getTextContent(options: {
    normalizeWhitespace: boolean;
    disableCombineTextItems: boolean;
  }): Promise<PdfTextContent>;
}

const ligaturesByWidth = new Map<number, string>([
  [5.882809619382731, "fi"],
  [8.935542499560421, "ffi"],
  [6.05273141117765, "fl"],
]);

export async function renderPdfPage(page: PdfPageData): Promise<string> {
  const content = await page.getTextContent({
    normalizeWhitespace: false,
    disableCombineTextItems: true,
  });
  let previousY: number | undefined;
  let text = "";

  for (const item of content.items) {
    const y = item.transform[5];
    const separator = previousY === undefined || previousY === y ? "" : "\n";
    text += separator + decodeLigature(item);
    previousY = y;
  }

  return text;
}

function decodeLigature(item: PdfTextItem): string {
  if (item.str !== "\u0000") return item.str;
  for (const [width, ligature] of ligaturesByWidth) {
    if (Math.abs(item.width - width) < 0.000001) return ligature;
  }
  throw new Error(`Unhandled PDF ligature glyph width: ${item.width}`);
}
