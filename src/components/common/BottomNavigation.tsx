'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  Users, 
  Building, 
  CreditCard,
  Plus,
  Settings,
  LogOut
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface BottomNavigationProps {
  userRole: string
  currentTab?: string
  onTabChange?: (tab: string) => void
}

export default function BottomNavigation({ userRole, currentTab, onTabChange }: BottomNavigationProps) {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  const getNavItems = () => {
    switch (userRole) {
      case 'ADMIN':
        return [
          { id: 'overview', label: 'Iktisar', icon: Home },
          { id: 'units', label: 'Unit', icon: Building },
          { id: 'transactions', label: 'Transaksi', icon: CreditCard },
          { id: 'users', label: 'Pengguna', icon: Users },
          { id: 'waste-types', label: 'Harga', icon: Settings },
        ]
      case 'UNIT':
        return [
          { id: 'overview', label: 'Iktisar', icon: Home },
          { id: 'nasabah', label: 'Nasabah', icon: Users },
          { id: 'deposit', label: 'Menabung', icon: Plus },
        ]
      case 'NASABAH':
        return [
          { id: 'overview', label: 'Iktisar', icon: Home },
          { id: 'transactions', label: 'Transaksi', icon: CreditCard },
          { id: 'card', label: 'Kartu', icon: CreditCard },
        ]
      default:
        return []
    }
  }

  const navItems = getNavItems()

  if (navItems.length === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentTab === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange?.(item.id)}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                isActive 
                  ? 'text-green-600 bg-green-50' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}