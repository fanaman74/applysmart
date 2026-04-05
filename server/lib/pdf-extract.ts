import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

const MAX_CHARS = 50_000

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const uint8 = new Uint8Array(buffer)
  const doc = await getDocument({ data: uint8, useSystemFonts: true }).promise

  const pageTexts: string[] = []

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const text = content.items
      .filter((item) => 'str' in item)
      .map((item) => (item as { str: string }).str)
      .join(' ')
    pageTexts.push(text)
  }

  const fullText = pageTexts.join('\n')
  return fullText.slice(0, MAX_CHARS)
}
