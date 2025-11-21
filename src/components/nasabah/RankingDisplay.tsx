'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpRight, Award, Crown } from 'lucide-react';
import RankingDetails from './RankingDetails'; // Import the new detailed view

// Interfaces for data structure
interface RankInfo {
  rank: number;
  name: string;
}

interface RankingData {
  weight: RankInfo;
  routine: RankInfo;
  balance: RankInfo;
}

// Skeleton Loader for the trigger
const RankingTriggerSkeleton = () => (
    <div className="flex items-center justify-between p-4">
        <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
    </div>
);

// The new trigger view
const RankingTriggerView = ({ rankingData, loading }) => {
    if (loading || !rankingData) {
        return <RankingTriggerSkeleton />;
    }

    const totalLevel = (rankingData.weight?.rank ?? 0) + (rankingData.routine?.rank ?? 0) + (rankingData.balance?.rank ?? 0);

    const ranks = [rankingData.weight, rankingData.routine, rankingData.balance];
    const highestRank = ranks.reduce((max, current) => (current.rank > max.rank ? current : max), ranks[0]);

    return (
        <div className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200  dark:bg-gradient-to-r dark:from-stone-700 dark:to-stone-800 dark:hover:from-stone-600 dark:hover:to-stone-700 transition-all duration-300">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-full bg-purple-100">
                        <Award className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-purple-700 dark:text-purple-500">Kelas {totalLevel}</p>
                        <p className="text-lg font-bold text-gray-800 dark:text-white">{highestRank.name}</p>
                    </div>
                </div>
                <div className="flex items-center text-sm font-semibold text-purple-600 dark:text-purple-400">
                    Lihat 
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                </div>
            </div>
        </div>
    );
}

// Main Ranking Display Component
export default function RankingDisplay() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { data: rankingData, loading } = useRealtimeData<RankingData>({ endpoint: '/api/ranking' });

  return (
    <div className="mt-6">
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} direction="bottom">
            <DrawerTrigger asChild onClick={() => setIsDrawerOpen(true)} className="cursor-pointer">
                <Card>
                    <CardHeader>
                        <CardTitle>Performa & Pencapaian</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RankingTriggerView rankingData={rankingData} loading={loading} />
                    </CardContent>
                </Card>
            </DrawerTrigger>
            <DrawerContent className="h-[100vh] mt-24 flex flex-col bg-white dark:bg-gray-900 text-white rounded-t-3xl"> 
                <div className="flex-1 overflow-y-auto pt-4">
                    <RankingDetails />
                </div>
            </DrawerContent>
        </Drawer>
    </div>
  );
}
