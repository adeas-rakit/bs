'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import AuthPage from '@/components/auth/AuthPage'
import AdminDashboard from '@/components/dashboard/AdminDashboard'
import UnitDashboard from '@/components/dashboard/UnitDashboard'
import NasabahDashboard from '@/components/dashboard/NasabahDashboard'
import { TabProvider } from '@/context/TabContext';
import { motion, AnimatePresence } from 'framer-motion'
import Loading from '@/components/ui/Loading'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
          toast.success("Login berhasil", {
            description: `Selamat datang kembali, ${data.user.name}!`,
          })
          window.history.replaceState({}, document.title, window.location.pathname)
        } else {
          toast.error("Login gagal", {
            description: data.error,
          })
        }
      } catch (error) {
        toast.error("Terjadi kesalahan", {
          description: "Silakan coba lagi",
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

    let dashboardComponent;
    switch (user.role) {
      case 'ADMIN':
        dashboardComponent = <AdminDashboard user={user} />;
        break;
      case 'UNIT':
        dashboardComponent = <UnitDashboard user={user} />;
        break;
      case 'NASABAH':
        dashboardComponent = <NasabahDashboard user={user} />;
        break;
      default:
        return <AuthPage />;
    }

    return (
      <TabProvider>
        {dashboardComponent}
      </TabProvider>
    );
  }

  if (loading) {
    return <Loading />
  }

  return (
    <main className="min-h-screen">
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
