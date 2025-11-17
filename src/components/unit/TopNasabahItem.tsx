
import { formatWeight, formatCurrency } from '@/lib/utils';

interface TopNasabahItemProps {
    nasabah: any;
    index: number;
}

const TopNasabahItem = ({ nasabah, index }: TopNasabahItemProps) => (
    <div className="flex items-center">
        <div className="font-bold mr-4">#{index + 1}</div>
        <div className="flex-grow">
            <p className="font-semibold">{nasabah.user.name}</p>
            <p className="text-sm text-muted-foreground">Total: {formatWeight(nasabah.totalWeight)}</p>
        </div>
        <div className="text-right">
            <div className="font-medium">{nasabah.depositCount}x Nabung</div>
            {nasabah.totalAmount && <div className="text-sm text-muted-foreground">{formatCurrency(nasabah.totalAmount)}</div>}
        </div>
    </div>
);

export default TopNasabahItem;
