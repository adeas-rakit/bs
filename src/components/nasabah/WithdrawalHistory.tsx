'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Calendar, Building, CircleDollarSign } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { EmptyState } from '@/components/ui/empty-state'

interface WithdrawalRequest {
    id: string;
    amount: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    unit?: { 
        name: string;
    };
}

interface WithdrawalHistoryProps {
  withdrawalRequests: WithdrawalRequest[]
}

const statusMap: { [key in WithdrawalRequest['status']]: { text: string; variant: 'secondary' | 'default' | 'destructive' } } = {
    PENDING: { text: 'Pending', variant: 'secondary' },
    APPROVED: { text: 'Berhasil', variant: 'default' },
    REJECTED: { text: 'Ditolak', variant: 'destructive' },
};

export default function WithdrawalHistory({ withdrawalRequests = [] }: WithdrawalHistoryProps) {
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
              withdrawalRequests.map((req) => {
                  const statusInfo = statusMap[req.status] || { text: 'Unknown', variant: 'secondary' };
                  return (
                    <Card key={req.id}>
                      <CardContent className="p-4 flex items-start justify-between">
                        <div className="space-y-2">
                          <p className="font-semibold text-lg">{formatCurrency(req.amount)}</p>
                           <p className="text-sm text-muted-foreground flex items-center"><Calendar className="inline h-3 w-3 mr-1.5"/>{formatDate(req.createdAt)}</p>
                           {req.unit && (
                            <p className="text-sm text-muted-foreground flex items-center"><Building className="inline h-3 w-3 mr-1.5"/>{req.unit.name}</p>
                           )}
                        </div>
                        <Badge 
                          variant={statusInfo.variant} 
                          className="capitalize text-sm"
                        >
                          {statusInfo.text}
                        </Badge>
                      </CardContent>
                    </Card>
                  )
              })
            ) : (
              <EmptyState
                icon={<CircleDollarSign />}
                title="Belum Ada Riwayat Penarikan"
                description="Anda belum pernah melakukan permintaan penarikan dana."
              />
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
