import { useState, useCallback } from 'react'
import { apiClient } from '../lib/api'

interface ParsedJobDescription {
  jobTitle: string
  companyName: string
  cleanedDescription: string
}

export function useJobDescription() {
  const [parsing, setParsing] = useState(false)
  const [result, setResult] = useState<ParsedJobDescription | null>(null)

  const parseJobDescription = useCallback(async (text: string) => {
    setParsing(true)
    setResult(null)

    try {
      const parsed = await apiClient.post<ParsedJobDescription>('/jd/parse', { text })
      setResult(parsed)
      return parsed
    } finally {
      setParsing(false)
    }
  }, [])

  return {
    parseJobDescription,
    parsing,
    result,
  }
}
