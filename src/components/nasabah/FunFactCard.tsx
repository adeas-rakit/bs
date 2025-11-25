
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FUN_FACTS } from '@/lib/constants';
import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { useMemo } from 'react';

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function FunFactCard() {
    const fact = useMemo(() => FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)], []);

    return (
        <motion.div variants={itemVariants} className="mt-6">
            <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-green-800 flex items-center">
                        <Lightbulb className="w-5 h-5 mr-2" />
                        Tahukah Anda?
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-green-700">{fact}</p>
                </CardContent>
            </Card>
        </motion.div>
    );
}
