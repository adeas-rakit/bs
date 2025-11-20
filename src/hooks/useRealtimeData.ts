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
    if (!endpoint) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        cache: 'no-store', // Disable caching to ensure fresh data is always fetched
      })
      
      if (response.ok) {
        const result = await response.json()
        setData(result.data || result)
        setError(null)
      } else {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        setError(`Failed to fetch data (${response.status})`)
      }
    } catch (err) {
      console.error('Network error:', err);
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