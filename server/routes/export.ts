import { Router } from 'express'
import type { Response } from 'express'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { authMiddleware } from '../middleware/auth.js'
import { supabaseAdmin } from '../lib/supabase.js'

export const exportRouter = Router()

const SUPPORTED_AGENTS = ['cover-letter', 'tailored-cv'] as const
type ExportableAgent = (typeof SUPPORTED_AGENTS)[number]

function isExportableAgent(name: string): name is ExportableAgent {
  return (SUPPORTED_AGENTS as readonly string[]).includes(name)
}

function extractText(agentName: ExportableAgent, result: Record<string, unknown>): string {
  if (agentName === 'cover-letter') {
    return (result.cover_letter as string) ?? ''
  }

  if (agentName === 'tailored-cv') {
    const parts: string[] = []
    if (result.summary) parts.push(String(result.summary))
    if (result.skills) {
      if (Array.isArray(result.skills)) {
        parts.push(result.skills.join(', '))
      } else {
        parts.push(String(result.skills))
      }
    }
    if (result.bullets) {
      if (Array.isArray(result.bullets)) {
        parts.push(result.bullets.join('\n'))
      } else {
        parts.push(String(result.bullets))
      }
    }
    return parts.join('\n\n')
  }

  return ''
}

async function buildPdf(title: string, text: string): Promise<Uint8Array> {
  const pdf = PDFDocument.create()
  const doc = await pdf
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold)
  const fontSize = 11
  const titleFontSize = 16
  const lineHeight = fontSize * 1.4
  const margin = 50
  const pageWidth = 595.28 // A4
  const pageHeight = 841.89

  const maxWidth = pageWidth - margin * 2

  // Split text into lines that fit within page width
  const lines: string[] = []
  for (const paragraph of text.split('\n')) {
    if (paragraph.trim() === '') {
      lines.push('')
      continue
    }
    const words = paragraph.split(' ')
    let currentLine = ''
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const testWidth = font.widthOfTextAtSize(testLine, fontSize)
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) lines.push(currentLine)
  }

  let page = doc.addPage([pageWidth, pageHeight])
  let y = pageHeight - margin

  // Title
  page.drawText(title, {
    x: margin,
    y,
    size: titleFontSize,
    font: boldFont,
    color: rgb(0, 0, 0),
  })
  y -= titleFontSize * 2

  // Body
  for (const line of lines) {
    if (y < margin + lineHeight) {
      page = doc.addPage([pageWidth, pageHeight])
      y = pageHeight - margin
    }

    if (line === '') {
      y -= lineHeight * 0.5
      continue
    }

    page.drawText(line, {
      x: margin,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    })
    y -= lineHeight
  }

  return doc.save()
}

exportRouter.get(
  '/export/:jobAnalysisId/:agentName',
  authMiddleware,
  async (req, res: Response) => {
    const userId = req.userId!
    const { jobAnalysisId, agentName } = req.params
    const format = (req.query.format as string) || 'txt'

    if (format !== 'txt' && format !== 'pdf') {
      res.status(400).json({ error: 'Invalid format. Supported: txt, pdf' })
      return
    }

    if (!isExportableAgent(agentName as string)) {
      res.status(400).json({
        error: `Agent "${agentName}" does not support export. Supported: ${SUPPORTED_AGENTS.join(', ')}`,
      })
      return
    }

    try {
      // Verify ownership
      const { data: analysis, error: analysisError } = await supabaseAdmin
        .from('job_analyses')
        .select('id, user_id, job_title, company_name')
        .eq('id', jobAnalysisId)
        .single()

      if (analysisError || !analysis) {
        res.status(404).json({ error: 'Analysis not found' })
        return
      }

      if (analysis.user_id !== userId) {
        res.status(403).json({ error: 'Not authorised to access this analysis' })
        return
      }

      // Fetch the agent result
      const { data: agentResult, error: resultError } = await supabaseAdmin
        .from('analysis_results')
        .select('result')
        .eq('job_analysis_id', jobAnalysisId)
        .eq('agent_name', agentName)
        .single()

      if (resultError || !agentResult) {
        res.status(404).json({ error: 'Agent result not found' })
        return
      }

      if (!agentResult.result) {
        res.status(404).json({ error: 'Agent result is empty' })
        return
      }

      const text = extractText(agentName as ExportableAgent, agentResult.result as Record<string, unknown>)
      if (!text) {
        res.status(404).json({ error: 'No exportable content found' })
        return
      }

      const titleParts = [agentName]
      if (analysis.job_title) titleParts.push(analysis.job_title)
      if (analysis.company_name) titleParts.push(analysis.company_name)
      const title = titleParts.join(' — ')
      const safeFilename = title.replace(/[^a-zA-Z0-9-_]/g, '_')

      if (format === 'txt') {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.txt"`)
        res.send(text)
        return
      }

      // PDF format
      const pdfBytes = await buildPdf(title, text)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.pdf"`)
      res.send(Buffer.from(pdfBytes))
    } catch (err) {
      console.error('Export error:', err)
      res.status(500).json({ error: 'Failed to export' })
    }
  },
)
