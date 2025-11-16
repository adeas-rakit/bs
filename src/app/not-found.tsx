'use client'

import { Home } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 text-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full">
        <h1 className="text-8xl md:text-9xl font-bold text-green-600 animate-pulse">404</h1>
        <h2 className="mt-6 text-2xl md:text-3xl font-semibold text-gray-800">Halaman Tidak Ditemukan</h2>
        <p className="mt-4 text-gray-600">Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.</p>
        <Link href="/" passHref>
          <button className="mt-8 inline-flex items-center rounded-full bg-green-600 px-8 py-3 text-white font-semibold shadow-lg transition-transform hover:scale-105 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50">
            <Home className="mr-2 h-5 w-5" />
            <span>Kembali ke Beranda</span>
          </button>
        </Link>
      </div>
    </div>
  )
}
