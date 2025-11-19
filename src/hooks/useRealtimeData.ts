'use client'

import { useEffect, useState, useCallback } from 'react'

interface UseRealtimeDataProps {
  endpoint: string
  refreshInterval?: number
}

export function useRealtimeData<T>({ endpoint, refreshInterval = 30000 }: UseRealtimeDataProps) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        setData(result.data || result)
        setError(null)
      } else {
        setError('Failed to fetch data')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    fetchData()
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchData, refreshInterval])

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);


  return { data, loading, error, refetch }
}

export function useRealtimeUpdates(callback: () => void, interval: number = 30000) {
  useEffect(() => {
    const intervalId = setInterval(callback, interval)
    return () => clearInterval(intervalId)
  }, [callback, interval])
}