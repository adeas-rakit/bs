'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import AuthPage from '@/components/auth/AuthPage'
import AdminDashboard from '@/components/dashboard/AdminDashboard'
import UnitDashboard from '@/components/dashboard/UnitDashboard'
import NasabahDashboard from '@/components/dashboard/NasabahDashboard'
import { motion, AnimatePresence } from 'framer-motion'

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
          setUser(data.user)
          toast({
            title: "Login berhasil",
            description: `Selamat datang kembali, ${data.user.name}!`,
          })
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

    const fetchUser = async () => {
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)

          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if(response.ok) {
            const data = await response.json()
            if (data.user) {
              setUser(data.user)
              localStorage.setItem('user', JSON.stringify(data.user))
            } else {
              handleLogout()
            }
          } else {
            handleLogout()
          }
        } catch (error) {
          handleLogout()
        }
      } else if (autoEmail && autoPassword) {
        await autoLogin()
      }
      setLoading(false)
    }

    fetchUser()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const renderDashboard = () => {
    if (!user) return <AuthPage />;

    switch (user.role) {
      case 'ADMIN':
        return <AdminDashboard user={user} />;
      case 'UNIT':
        return <UnitDashboard user={user} />;
      case 'NASABAH':
        return <NasabahDashboard user={user} />;
      default:
        return <AuthPage />;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 360],
          }}
          transition={{
            duration: 2,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        >
          <svg className="w-24 h-24 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v.01M12 20v.01M4.93 4.93l.01.01M19.07 19.07l.01.01M4.93 19.07l.01-.01M19.07 4.93l.01-.01M20 12h-.01M4 12h-.01" />
          </svg>
        </motion.div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
       <AnimatePresence mode="wait">
        <motion.div
          key={user ? user.role : 'auth'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderDashboard()}
        </motion.div>
      </AnimatePresence>
    </main>
  )
}
