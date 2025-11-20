'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Calendar, User, Weight, Locate } from 'lucide-react'
import { formatCurrency, formatWeight } from '@/lib/utils'

// Definisikan tipe data transaksi yang komprehensif
export interface Transaction {
  id: string;
  transactionNo: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  nasabah: {
    user: {
      name: string;
    };
  };
  user: {
    name: string;
  };
  unit: {
    name: string;
  }
  totalAmount: number;
  totalWeight: number;
  createdAt: string;
  items: {
    id: string;
    wasteType?: { // Dibuat opsional untuk mendukung data penarikan
      name: string;
    };
    weight: number;
    amount: number;
  }[];
}

interface TransactionAccordionProps {
  transactions: Transaction[];
  openAccordion?: string[];
  onValueChange?: (value: string[]) => void;
  highlightedId?: string | null;
}

export default function TransactionAccordion({
  transactions,
  openAccordion,
  onValueChange,
  highlightedId,
}: TransactionAccordionProps) {
  return (
    <Accordion
      type="multiple"
      className="w-full space-y-2 p-2"
      value={openAccordion}
      onValueChange={onValueChange}
    >
      {transactions.map((trx) => (
        <AccordionItem
          value={trx.id}
          key={trx.id}
          className={`border rounded-lg ${
            highlightedId === trx.id ? 'lightbeam-animate' : ''
          }`}
        >
          <AccordionTrigger className="p-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors rounded-lg">
            <div className="w-full">
              <div className="flex justify-between items-start">
                <div className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>{trx.nasabah.user.name}</span>
                </div>
                <div className="text-gray-600 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{new Date(trx.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
              <div className="mt-2 flex justify-between items-center text-gray-600 pl-6">
                <div className="flex items-center gap-2">
                  <Weight className="h-4 w-4 text-gray-500" />
                  <span>{trx.type === 'WITHDRAWAL' ? 'Penarikan' : formatWeight(trx.totalWeight)}</span>
                </div>
                <div className={`flex items-center gap-2 font-semibold ${trx.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'}`}>
                  <span>{trx.type === 'WITHDRAWAL' ? '-' : '+'}{formatCurrency(trx.totalAmount)}</span>
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-4 border-t rounded-b-lg">
            <div className="space-y-3">
              <h3 className="font-sm">{trx.transactionNo}</h3>
              <h4 className="font-semibold">{trx.type === 'WITHDRAWAL' ? 'Penarikan Saldo' : 'Detail Sampah'}</h4>
              {trx.type === 'DEPOSIT' ? (
                <ul className="space-y-2">
                  {trx.items.map(item => (
                    <li key={item.id} className="flex justify-between items-center text-sm">
                      <div>
                        {item.wasteType && <span className="font-medium">{item.wasteType.name}</span>}
                        <span className="text-gray-500 ml-2">({formatWeight(item.weight)})</span>
                      </div>
                      <span className="font-medium text-gray-600">{formatCurrency(item.amount)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600">
                  Penarikan tunai oleh nasabah sebesar {formatCurrency(trx.totalAmount)}.
                </p>
              )}
              <div className="border-t pt-3 mt-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Dicatat oleh:</span>
                  <span className="font-medium">{trx.user.name}</span>
                </div>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex items-center gap-2 text-sm">
                  <Locate className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Lokasi:</span>
                  <span className="font-medium">{trx.unit.name}</span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
