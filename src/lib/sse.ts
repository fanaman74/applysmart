export interface SSEEvent {
  event: string
  data: string
}

/**
 * Parse SSE events from a fetch Response with a ReadableStream body.
 * Works with POST requests (unlike EventSource which only supports GET).
 */
export async function* parseSSEStream(
  response: Response
): AsyncGenerator<SSEEvent> {
  const body = response.body
  if (!body) {
    throw new Error('Response body is null — cannot parse SSE stream')
  }

  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      let currentEvent = ''
      let currentData = ''

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7)
        } else if (line.startsWith('data: ')) {
          currentData = line.slice(6)
        } else if (line === '') {
          if (currentEvent && currentData) {
            yield { event: currentEvent, data: currentData }
          }
          currentEvent = ''
          currentData = ''
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
