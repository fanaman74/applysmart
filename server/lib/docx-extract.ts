import mammoth from 'mammoth'

const MAX_CHARS = 50_000

export async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer })
  return result.value.slice(0, MAX_CHARS)
}
