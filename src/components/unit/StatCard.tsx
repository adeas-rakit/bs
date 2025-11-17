
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color?: string;
}

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const StatCard = ({ title, value, icon: Icon, color }: StatCardProps) => (
    <motion.div variants={itemVariants}>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className={`h-4 w-4 ${color || 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${color || ''}`}>{value}</div>
            </CardContent>
        </Card>
    </motion.div>
);

export default StatCard;
