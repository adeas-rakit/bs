
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { formatDate, formatCurrency } from '@/lib/utils'

interface RecentActivityProps {
  recentTransactions: any[]
}

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function RecentActivity({ recentTransactions }: RecentActivityProps) {
  return (
    <motion.div variants={itemVariants} className="mt-6">
      <Card>
        <CardHeader><CardTitle>Aktivitas Terkini</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="h-60">
            <div className="space-y-4">
              {recentTransactions.map(t => (
                <div key={t.id} className="flex items-center">
                  <div className="flex-grow">
                    <p className="font-semibold text-sm">{t.transactionNo}</p>
                    <p className="text-xs text-muted-foreground">{t.unit?.name} &bull; {formatDate(t.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={t.type === 'DEPOSIT' ? 'default' : 'destructive'} className="capitalize text-xs">{t.type.toLowerCase()}</Badge>
                    <p className="font-semibold text-sm mt-1">{formatCurrency(t.totalAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  )
}
