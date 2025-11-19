'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { motion } from 'framer-motion'

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color?: string;
    tooltipText?: string;
}

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const StatCard = ({ title, value, icon: Icon, color, tooltipText }: StatCardProps) => (
    <motion.div variants={itemVariants}>
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs md:text-sm font-medium">{title}</CardTitle>
                            <Icon className={`h-4 w-4 ${color || 'text-muted-foreground'}`} />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-md md:text-2xl font-bold ${color || ''}`}>{value}</div>
                        </CardContent>
                    </Card>
                </TooltipTrigger>
                {tooltipText && <TooltipContent>{tooltipText}</TooltipContent>}
            </Tooltip>
        </TooltipProvider>
    </motion.div>
);

export default StatCard;