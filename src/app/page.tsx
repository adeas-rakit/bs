'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import AuthPage from '@/components/auth/AuthPage'
import AdminDashboard from '@/components/dashboard/AdminDashboard'
import UnitDashboard from '@/components/dashboard/UnitDashboard'
import NasabahDashboard from '@/components/dashboard/NasabahDashboard'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    const urlParams = new URLSearchParams(window.location.search)
    const autoEmail = urlParams.get('email')
    const autoPassword = urlParams.get('password')

    if (autoEmail && autoPassword && !token && !userData) {
      // Auto login from demo accounts page
      const autoLogin = async () => {
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: autoEmail, password: autoPassword }),
          })

          const data = await response.json()

          if (response.ok) {
            localStorage.setItem('token', data.token)
            localStorage.setItem('user', JSON.stringify(data.user))
            
            toast({
              title: "Login berhasil",
              description: `Selamat datang kembali, ${data.user.name}!`,
            })

            // Clear URL params
            window.history.replaceState({}, document.title, window.location.pathname)
          } else {
            toast({
              title: "Login gagal",
              description: data.error,
              variant: "destructive",
            })
          }
        } catch (error) {
          toast({
            title: "Terjadi kesalahan",
            description: "Silakan coba lagi",
            variant: "destructive",
          })
        }
      }

      autoLogin()
      return
    }

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        
        fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).then(res => res.json())
          .then(data => {
            if (data.user) {
              setUser(data.user)
              localStorage.setItem('user', JSON.stringify(data.user))
            } else {
              localStorage.removeItem('token')
              localStorage.removeItem('user')
              setUser(null)
            }
          })
          .catch(() => {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            setUser(null)
          })
      } catch (error) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
      }
    }
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  if (user.role === 'ADMIN') {
    return <AdminDashboard user={user} />
  }

  if (user.role === 'UNIT') {
    return <UnitDashboard user={user} />
  }

  if (user.role === 'NASABAH') {
    return <NasabahDashboard user={user} />
  }

  return <AuthPage />
}