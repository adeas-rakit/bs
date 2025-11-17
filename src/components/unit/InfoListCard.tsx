
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { motion } from 'framer-motion'

interface InfoListCardProps {
    title: string;
    children: React.ReactNode;
}

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const InfoListCard = ({ title, children }: InfoListCardProps) => (
    <motion.div variants={itemVariants}>
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-80">
                    <div className="space-y-4">
                        {children}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    </motion.div>
);

export default InfoListCard;
