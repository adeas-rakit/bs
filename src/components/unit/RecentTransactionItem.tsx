
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

interface RecentTransactionItemProps {
    transaction: any;
}

const RecentTransactionItem = ({ transaction }: RecentTransactionItemProps) => (
    <div className="flex items-center">
        <div className="flex-grow">
            <p className="font-semibold">{transaction.transactionNo}</p>
            <p className="text-sm text-muted-foreground">{transaction.nasabah.user.name}</p>
        </div>
        <div className="text-right">
            <Badge variant={transaction.type === 'DEPOSIT' ? 'default' : 'destructive'}>{transaction.type}</Badge>
            <p className="font-semibold text-sm mt-1">{formatCurrency(transaction.totalAmount)}</p>
        </div>
    </div>
);

export default RecentTransactionItem;
