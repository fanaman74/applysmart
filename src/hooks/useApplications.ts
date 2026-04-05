import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../lib/api'

export interface Application {
  id: string
  jobTitle: string
  companyName: string
  status: string
  trackerStatus: string
  matchScore: number | null
  location: string | null
  remoteType: string | null
  createdAt: string
  updatedAt: string
}

export function useApplications() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchApplications = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.get<Application[]>('/tracker')
      setApplications(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch applications'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateStatus = useCallback(async (id: string, trackerStatus: string) => {
    // Optimistic update
    setApplications((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, trackerStatus } : app,
      ),
    )

    try {
      await apiClient.patch(`/tracker/${id}/status`, { trackerStatus })
    } catch (err) {
      // Revert on failure
      await fetchApplications()
      throw err
    }
  }, [fetchApplications])

  const deleteApplication = useCallback(async (id: string) => {
    // Optimistic removal
    setApplications((prev) => prev.filter((app) => app.id !== id))

    try {
      await apiClient.delete(`/tracker/${id}`)
    } catch (err) {
      // Revert on failure
      await fetchApplications()
      throw err
    }
  }, [fetchApplications])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  return {
    applications,
    loading,
    error,
    fetchApplications,
    updateStatus,
    deleteApplication,
  }
}
