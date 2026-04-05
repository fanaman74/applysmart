import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../lib/api'

interface UsageData {
  plan: string
  analysesUsed: number
  limit: number
  periodStart: string
}

export function useUsage() {
  const [data, setData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const result = await apiClient.get<UsageData>('/usage')
      setData(result)
    } catch (err) {
      console.error('Failed to fetch usage:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return {
    plan: data?.plan ?? 'free',
    analysesUsed: data?.analysesUsed ?? 0,
    limit: data?.limit ?? 3,
    periodStart: data?.periodStart ?? '',
    loading,
    refetch,
  }
}
