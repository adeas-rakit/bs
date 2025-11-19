'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Building, 
  Users, 
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DemoAccounts() {
  const [showPasswords, setShowPasswords] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const router = useRouter()

  const accounts = [
    {
      type: 'Admin',
      icon: User,
      color: 'bg-purple-100 text-purple-800',
      description: 'Akses penuh ke semua fitur sistem',
      accounts: [
        {
          email: 'admin@bs.id',
          password: 'admin@bs.id',
          name: 'Admin Utama',
          features: ['Manajemen Unit', 'Manajemen Pengguna', 'Monitoring Transaksi', 'Pengaturan Harga']
        }
      ]
    },
    {
      type: 'Unit',
      icon: Building,
      color: 'bg-blue-100 text-blue-800',
      description: 'Kelola operasional unit bank sampah',
      accounts: [
        {
          email: 'unit@bs.id',
          password: 'unit@bs.id',
          name: 'Unit Setiawan (RT 1/1)',
          features: ['Manajemen Nasabah', 'Pencatatan Tabungan', 'QR Scanner', 'Dashboard Unit']
        },
        {
          email: 'unit2@bs.id',
          password: 'unit2@bs.id',
          name: 'Unit2 Setiawan (RT 2/1)',
          features: ['Manajemen Nasabah', 'Pencatatan Tabungan', 'QR Scanner', 'Dashboard Unit']
        }
      ]
    },
    {
      type: 'Nasabah',
      icon: Users,
      color: 'bg-green-100 text-green-800',
      description: 'Nasabah bank sampah',
      accounts: [
        {
          email: 'ade@bs.id',
          password: 'ade@bs.id',
          name: 'Adeas',
          features: ['Lihat Saldo', 'Riwayat Transaksi', 'Kartu Digital QR']
        },
        {
          email: 'indri@bs.id',
          password: 'indri@bs.id',
          name: 'Indri',
          features: ['Lihat Saldo', 'Riwayat Transaksi', 'Kartu Digital QR']
        },
        {
          email: 'ade2@bs.id',
          password: 'ade2@bs.id',
          name: 'Adeas2',
          features: ['Lihat Saldo', 'Riwayat Transaksi', 'Kartu Digital QR']
        },
        {
          email: 'indri2@bs.id',
          password: 'indri2@bs.id',
          name: 'Indri2',
          features: ['Lihat Saldo', 'Riwayat Transaksi', 'Kartu Digital QR']
        }
      ]
    }
  ]

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const handleQuickLogin = (email: string, password: string) => {
    // Auto-fill login form and submit
    const form = document.querySelector('form') as HTMLFormElement
    if (form) {
      const emailInput = form.querySelector('input[name="email"]') as HTMLInputElement
      const passwordInput = form.querySelector('input[name="password"]') as HTMLInputElement
      
      if (emailInput && passwordInput) {
        emailInput.value = email
        passwordInput.value = password
        
        // Trigger submit event
        form.dispatchEvent(new Event('submit', { cancelable: true }))
      }
    } else {
      // Fallback: redirect to login page with query params
      window.location.href = `/?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Akun Demo Bank Sampah</h1>
          <p className="text-gray-500">Gunakan akun berikut untuk mencoba semua fitur aplikasi</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {accounts.map((accountType) => {
            const Icon = accountType.icon
            return (
              <Card key={accountType.type} className="h-fit">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-2 p-3 rounded-full bg-gray-100">
                    <Icon className="h-8 w-8 text-gray-700" />
                  </div>
                  <CardTitle className="text-xl">{accountType.type}</CardTitle>
                  <CardDescription>{accountType.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {accountType.accounts.map((account, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold">{account.name}</h3>
                        <Badge className={accountType.color}>
                          {accountType.type}
                        </Badge>
                      </div>
                      
                      {account.balance && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Saldo:</span>
                          <span className="font-medium text-green-600">{account.balance}</span>
                        </div>
                      )}
                      
                      {account.weight && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Total Sampah:</span>
                          <span className="font-medium">{account.weight}</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Email:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{account.email}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(account.email, `email-${index}`)}
                            >
                              {copied === `email-${index}` ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Password:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">
                              {showPasswords ? account.password : '••••••••'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowPasswords(!showPasswords)}
                            >
                              {showPasswords ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(account.password, `pass-${index}`)}
                            >
                              {copied === `pass-${index}` ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      <Button 
                        className="w-full mt-3"
                        onClick={() => handleQuickLogin(account.email, account.password)}
                      >
                        Login sebagai {account.name}
                      </Button>
                    </div>
                  ))}

                  <div className="mt-4 p-3 rounded-lg">
                    <h4 className="font-medium mb-2">Fitur {accountType.type}:</h4>
                    <ul className="text-sm space-y-1">
                      {accountType.accounts[0].features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-8 text-center">
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
            className="px-8"
          >
            Kembali ke Halaman Login
          </Button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>💡 <strong>Tips:</strong> Klik tombol copy untuk menyalin email/password dengan cepat</p>
          <p>🔒 Password disembunyikan secara default, klik ikon mata untuk melihat</p>
        </div>
      </div>
    </div>
  )
}
