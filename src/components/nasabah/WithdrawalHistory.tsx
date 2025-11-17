
'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Calendar } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

interface WithdrawalHistoryProps {
  withdrawalRequests: any[]
}

export default function WithdrawalHistory({ withdrawalRequests }: WithdrawalHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat Penarikan</CardTitle>
        <CardDescription>Daftar pengajuan penarikan dana Anda.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[70vh]">
          <div className="space-y-4">
            {withdrawalRequests.length > 0 ? (
              withdrawalRequests.map((req) => (
                <Card key={req.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold text-lg">{formatCurrency(req.amount)}</p>
                      <p className="text-sm text-muted-foreground"><Calendar className="inline h-3 w-3 mr-1"/>{formatDate(req.createdAt)}</p>
                    </div>
                    <Badge 
                      variant={req.status === 'PENDING' ? 'secondary' : req.status === 'APPROVED' ? 'default' : 'destructive'} 
                      className="capitalize text-sm"
                    >
                      {req.status.replace('APPROVED', 'SUCCESS').toLowerCase()}
                    </Badge>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center text-gray-500 py-10">
                <p>Belum ada riwayat penarikan.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
