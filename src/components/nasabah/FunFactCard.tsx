
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { useMemo } from 'react';

const funFacts = [
    "Mendaur ulang 1 botol plastik dapat menghemat energi yang cukup untuk menyalakan bola lampu 60 watt selama 6 jam.",
    "Industri daur ulang di Indonesia berhasil mengurangi emisi karbon dioksida setara dengan menanam 1,5 juta pohon setiap tahun.",
    "Aluminium dapat didaur ulang tanpa henti tanpa kehilangan kualitasnya. Mendaur ulang kaleng aluminium menghemat 95% energi dibandingkan membuatnya dari bahan mentah.",
    "Untuk setiap ton kertas yang didaur ulang, kita menyelamatkan sekitar 17 pohon, 7.000 galon air, dan 463 galon minyak.",
    "Kaca 100% dapat didaur ulang dan dapat didaur ulang tanpa henti tanpa kehilangan kualitas atau kemurniannya.",
    "Lebih dari 60% sampah yang berakhir di tempat sampah sebenarnya bisa didaur ulang.",
    "Mendaur ulang satu kaleng aluminium menghemat energi yang cukup untuk menyalakan TV selama tiga jam.",
];

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function FunFactCard() {
    const fact = useMemo(() => funFacts[Math.floor(Math.random() * funFacts.length)], []);

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
