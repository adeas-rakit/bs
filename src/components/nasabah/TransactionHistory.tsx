'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Combobox } from '@/components/ui/combobox'
import { Badge } from '@/components/ui/badge'
import { Calendar, Landmark, History } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { EmptyState } from '@/components/ui/empty-state'

interface TransactionHistoryProps {
  transactions: any[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  typeFilter: string
  setTypeFilter: (type: string) => void
}

export default function TransactionHistory({ 
  transactions, 
  searchTerm, 
  setSearchTerm, 
  typeFilter, 
  setTypeFilter 
}: TransactionHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat Transaksi</CardTitle>
        <CardDescription>Cari dan filter riwayat transaksi Anda</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <Input 
            placeholder="Cari No. Transaksi..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="sm:col-span-2"
          />
          <Combobox
            options={[
              { label: "Semua Tipe", value: "all" },
              { label: "Deposit", value: "DEPOSIT" },
              { label: "Penarikan", value: "WITHDRAWAL" },
            ]}
            value={typeFilter}
            onChange={setTypeFilter}
            placeholder="Tipe"
            searchPlaceholder="Cari tipe..."
            emptyPlaceholder="Tipe tidak ditemukan."
          />
        </div>
        <ScrollArea className="h-[60vh]">
          <div className="space-y-4">
            {transactions.length > 0 ? transactions.map((t) => (
              <Card key={t.id}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-sm">{t.transactionNo}</h3>
                    <p className="text-xs text-muted-foreground"><Landmark className="inline h-3 w-3 mr-1"/>{t.unit?.name}</p>
                    <p className="text-xs text-muted-foreground"><Calendar className="inline h-3 w-3 mr-1"/>{formatDate(t.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-base ${t.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(t.totalAmount)}</p>
                    <Badge variant={t.status === 'SUCCESS' ? 'default' : 'secondary'} className="capitalize text-xs mt-1">{t.status.toLowerCase()}</Badge>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <EmptyState 
                icon={<History />}
                title="Tidak Ada Riwayat Transaksi"
                description="Anda belum memiliki transaksi, atau tidak ada yang cocok dengan filter Anda."
              />
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
