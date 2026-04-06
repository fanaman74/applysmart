import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import type { TextItem } from 'pdfjs-dist/types/src/display/api.js'

const MAX_CHARS = 50_000

/**
 * Extract text from a PDF buffer, preserving paragraph and line structure.
 *
 * pdfjs-dist returns individual text "items" with x/y coordinates.
 * Simply joining them with spaces loses all structure and produces garbled
 * output (e.g. "John Smith Senior IT Programme Manager" becomes
 * "JohnSmithSeniorITProgrammeManager"). Instead we:
 *  1. Sort items by page then by vertical position (top→bottom)
 *  2. Group items into lines by y-position proximity (within 2pt = same line)
 *  3. Sort each line's items left→right
 *  4. Insert blank lines between paragraphs (gap > 10pt)
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const uint8 = new Uint8Array(buffer)
  const doc = await getDocument({
    data: uint8,
    useSystemFonts: true,
    // Suppress the "Setting up fake worker" warning in Node
    disableWorker: true,
  } as Parameters<typeof getDocument>[0]).promise

  const allLines: string[] = []

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum)
    const viewport = page.getViewport({ scale: 1 })
    const content = await page.getTextContent()

    // Only keep real text items with non-empty content
    const items = content.items.filter(
      (item): item is TextItem => 'str' in item && item.str.trim().length > 0,
    )

    if (items.length === 0) continue

    // Each item has a transform matrix [a, b, c, d, e, f]
    // e = x position, f = y position (from bottom of page)
    // Convert to top-relative: top_y = pageHeight - f
    const positioned = items.map((item) => ({
      text: item.str,
      x: item.transform[4],
      y: viewport.height - item.transform[5], // top-relative
    }))

    // Group items into lines: same line if y is within 2pt of each other
    const lineGroups: Array<{ y: number; items: typeof positioned }> = []

    for (const item of positioned) {
      const existingLine = lineGroups.find((g) => Math.abs(g.y - item.y) < 2)
      if (existingLine) {
        existingLine.items.push(item)
      } else {
        lineGroups.push({ y: item.y, items: [item] })
      }
    }

    // Sort lines top→bottom
    lineGroups.sort((a, b) => a.y - b.y)

    let prevY: number | null = null

    for (const group of lineGroups) {
      // Insert blank line if there's a significant vertical gap (paragraph break)
      if (prevY !== null && group.y - prevY > 10) {
        allLines.push('')
      }

      // Sort items within the line left→right
      group.items.sort((a, b) => a.x - b.x)

      // Join items — add a space between items that aren't directly adjacent
      let lineText = ''
      for (let i = 0; i < group.items.length; i++) {
        const item = group.items[i]
        if (i === 0) {
          lineText = item.text
        } else {
          const prev = group.items[i - 1]
          // If there's a gap > 3pt between end of prev and start of this, add space
          const gap = item.x - (prev.x + prev.text.length * 5) // rough char width
          lineText += gap > 3 ? ' ' + item.text : item.text
        }
      }

      const trimmed = lineText.trim()
      if (trimmed.length > 0) {
        allLines.push(trimmed)
      }

      prevY = group.y
    }

    // Page separator
    if (pageNum < doc.numPages) {
      allLines.push('')
      allLines.push('---')
      allLines.push('')
    }
  }

  const fullText = allLines.join('\n')

  if (fullText.trim().length === 0) {
    throw new Error(
      'No text could be extracted from this PDF. It may be a scanned image. Please upload a text-based PDF or a DOCX file.',
    )
  }

  return fullText.slice(0, MAX_CHARS)
}
