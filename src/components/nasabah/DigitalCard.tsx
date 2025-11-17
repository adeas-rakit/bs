
'use client'

import { motion } from 'framer-motion'
import { formatCurrency, formatWeight } from '@/lib/utils'

interface DigitalCardProps {
  user: any
  balance: number
  totalWeight: number
}

export default function DigitalCard({ user, balance, totalWeight }: DigitalCardProps) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-center items-center h-full">
      <div className="w-full max-w-md bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-6 text-white font-mono relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-500/20 rounded-full filter blur-xl"></div>
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-blue-500/20 rounded-full filter blur-2xl"></div>
          <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold tracking-wider">E-SBM</span>
                  <img src="/logo.svg" alt="Logo" className="w-12 h-12 opacity-80"/>
              </div>
              <div className="text-center my-8">
                  <img src={user.qrCode} alt="QR Code" className="w-32 h-32 rounded-lg ring-4 ring-white/50 mx-auto" />
              </div>
              <div className="text-center mb-6">
                  <p className="text-2xl font-bold tracking-wider">{user.name}</p>
                  <p className="text-lg text-green-400 tracking-widest font-sans">{user.nasabah?.accountNo}</p>
              </div>
              <div className="flex justify-between items-end bg-black/20 p-4 rounded-lg">
                  <div>
                      <p className="text-xs uppercase tracking-wider text-white/50">Saldo</p>
                      <p className="text-xl font-bold tracking-wider">{formatCurrency(balance)}</p>
                  </div>
                  <div>
                     <p className="text-xs uppercase tracking-wider text-white/50">Total Sampah</p>
                     <p className="text-xl font-bold tracking-wider text-right">{formatWeight(totalWeight)}</p>
                  </div>
              </div>
          </div>
      </div>
    </motion.div>
  )
}
