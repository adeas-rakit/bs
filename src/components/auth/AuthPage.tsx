'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Combobox } from '@/components/ui/combobox'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, LogIn, UserPlus, MessageCircle } from 'lucide-react'
import TypingAnimation from '@/components/ui/TypingAnimation'

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [tab, setTab] = useState('login')
  const [role, setRole] = useState('NASABAH')
  const [showVerification, setShowVerification] = useState(false)
  const [adminPhone, setAdminPhone] = useState('')
  const [verificationTitle, setVerificationTitle] = useState('Registrasi Berhasil!')
  const [verificationDescription, setVerificationDescription] = useState('Akun Anda telah terdaftar namun berstatus Belum Aktif verifikasi admin mungkin diperlukan.')

  const router = useRouter()

  const formatPhoneNumber = (phone: string) => {
    if (phone.startsWith('08')) {
      return `62${phone.substring(1)}`;
    }
    return phone;
  };

  useEffect(() => {
    const fetchAdminPhone = async () => {
      try {
        const response = await fetch('/api/admin/contact');
        const data = await response.json();
        setAdminPhone(formatPhoneNumber(data.phone || '081234567890'));
      } catch (error) {
        console.error('Failed to fetch admin phone number:', error);
        setAdminPhone('6281234567890'); // Fallback phone number
      }
    };
    fetchAdminPhone();
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const loadingToast = toast.loading('Logging in...')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        toast.success("Login Berhasil", {
          id: loadingToast,
          description: `Selamat datang kembali, ${data.user.name}!`,
        })
        setTimeout(() => {
          window.location.href = '/'
        }, 1000)
      } else {
        if (response.status === 403) { // Ditangguhkan
            setVerificationTitle('Akun Belum Aktif');
            setVerificationDescription(data.error);
            setShowVerification(true);
            toast.error('Login Gagal', { id: loadingToast, description: data.error });
        } else {
            toast.error("Login Gagal", {
              id: loadingToast,
              description: data.error,
            })
        }
      }
    } catch (error) {
      toast.error("Terjadi Kesalahan", {
        id: loadingToast,
        description: "Silakan coba lagi nanti.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const loadingToast = toast.loading('Mendaftarkan akun...')

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const phone = formData.get('phone') as string

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, phone, role }),
      })
      const data = await response.json()

      if (response.ok) {
        if (role === 'UNIT') {
          setVerificationTitle('Registrasi Unit Berhasil');
          setVerificationDescription('Akun Anda perlu diverifikasi oleh Admin.');
          setShowVerification(true)
          toast.success("Registrasi Unit Berhasil", {
            id: loadingToast,
            description: "Akun Anda perlu diverifikasi oleh Admin.",
          })
        } else {
          localStorage.setItem('token', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
          toast.success("Registrasi Berhasil", {
            id: loadingToast,
            description: `Selamat datang, ${data.user.name}!`,
          })
          setTimeout(() => {
            window.location.href = '/'
          }, 1000)
        }
      } else {
        toast.error("Registrasi Gagal", {
          id: loadingToast,
          description: data.error,
        })
      }
    } catch (error) {
      toast.error("Terjadi Kesalahan", {
        id: loadingToast,
        description: "Silakan coba lagi nanti.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-green-400 to-blue-500 text-white p-12">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl font-bold mb-4">Bank Sampah Digital</h1>
          <p className="text-xl">Transformasi pengelolaan sampah untuk masa depan yang lebih hijau.</p>
        </motion.div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <Card className="w-full max-w-md shadow-2xl">
          {showVerification ? (
            <CardContent className='pt-6'>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center p-4"
              >
                <CardHeader>
                  <CardTitle className="text-2xl text-green-600">{verificationTitle}</CardTitle>
                  <CardDescription>{verificationDescription}</CardDescription>
                </CardHeader>
                <p className="mb-6 text-sm text-gray-600">Untuk mempercepat proses, silakan hubungi Admin kami melalui WhatsApp dengan menekan tombol di bawah.</p>
                <Button
                  onClick={() => window.open(`https://wa.me/${adminPhone}?text=Halo%20Admin%2C%20saya%20ingin%20memverifikasi%20akun%20Unit%20Bank%20Sampah%20saya.`, '_blank')}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3"
                >
                  <MessageCircle className="mr-2 h-5 w-5" /> Hubungi Admin (WA)
                </Button>
                <Button
                  variant="link"
                  onClick={() => setShowVerification(false)}
                  className="mt-4 text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Kembali ke Login
                </Button>
              </motion.div>
            </CardContent>
          ) : (
            <>
              <CardHeader className="text-center">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}>
                  <img src="/logo.svg" alt="Bank Sampah Logo" className="w-24 h-24 mx-auto mb-4" />
                  <TypingAnimation text="Selamat Datang" className="text-3xl font-bold text-foreground" />
                  <TypingAnimation text="Login atau Register untuk memulai" className="text-gray-500" />
                </motion.div>
              </CardHeader>
              <CardContent>
                <Tabs value={tab} onValueChange={setTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={tab}
                      variants={formVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      transition={{ type: 'tween' }}
                    >
                      <TabsContent value="login" className="-mt-4">
                        <form onSubmit={handleLogin} className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="email@contoh.com" required className="transition-all duration-300 focus:ring-2 focus:ring-green-500" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" placeholder="••••••••" required className="transition-all duration-300 focus:ring-2 focus:ring-green-500" />
                          </div>
                          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold transition-transform transform hover:scale-105" disabled={isLoading}>
                            {isLoading ? "Memproses..." : <><LogIn className="mr-2 h-4 w-4" /> Login</>}
                          </Button>
                        </form>
                      </TabsContent>
                      <TabsContent value="register" className="-mt-4">
                        <form onSubmit={handleRegister} className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label htmlFor="reg-name">Nama Lengkap</Label>
                            <Input id="reg-name" name="name" type="text" placeholder="John Doe" required className="transition-all duration-300 focus:ring-2 focus:ring-green-500"/>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="reg-email">Email</Label>
                            <Input id="reg-email" name="email" type="email" placeholder="email@contoh.com" required className="transition-all duration-300 focus:ring-2 focus:ring-green-500"/>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="reg-phone">No. Telepon</Label>
                            <Input id="reg-phone" name="phone" type="tel" placeholder="081234567890" className="transition-all duration-300 focus:ring-2 focus:ring-green-500"/>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="reg-role">Jenis Akun</Label>
                            <Combobox
                              options={[
                                { label: "Nasabah", value: "NASABAH" },
                                { label: "Unit Bank Sampah", value: "UNIT" },
                              ]}
                              value={role}
                              onChange={setRole}
                              placeholder="Pilih jenis akun"
                              searchPlaceholder="Cari jenis akun..."
                              emptyPlaceholder="Jenis akun tidak ditemukan."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="reg-password">Password</Label>
                            <Input id="reg-password" name="password" type="password" placeholder="••••••••" required className="transition-all duration-300 focus:ring-2 focus:ring-green-500"/>
                          </div>
                          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-transform transform hover:scale-105" disabled={isLoading}>
                            {isLoading ? "Memproses..." : <><UserPlus className="mr-2 h-4 w-4" /> Register</>}
                          </Button>
                        </form>
                      </TabsContent>
                    </motion.div>
                  </AnimatePresence>
                </Tabs>
                <div className="mt-6 text-center">
                  <Button variant="link" onClick={() => router.push('/demo-accounts')} className="text-green-600 hover:text-green-800">
                    Lihat Akun Demo <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
