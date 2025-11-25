'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Recycle, Wallet, User, Crown, Target, Award } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Interfaces
interface Rank {
  rank: number;
  name: string;
  value: number;
  nextRank: { name: string; target: number; } | null;
  progress: number;
}

interface RankingData {
  weight: Rank;
  routine: Rank;
  balance: Rank;
}

interface UserData {
    name: string;
}

interface RankingDetailsProps {
  rankingData: RankingData | null;
  loading: boolean;
}

// --- Helper Data ---
const categoryDetails = {
  weight: { icon: Recycle, color: 'green', title: 'Total Berat Sampah', unit: 'kg' },
  routine: { icon: Trophy, color: 'yellow', title: 'Rutinitas Setoran (30 hari)', unit: 'x' },
  balance: { icon: Wallet, color: 'blue', title: 'Saldo Tabungan', unit: 'Rp' },
};

// --- Sub-Components ---
const UserProfileSkeleton = () => (
    <div className="flex flex-col items-center p-8 text-center bg-card rounded-b-3xl shadow-lg">
        <Skeleton className="h-28 w-28 rounded-full mb-4" />
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
    </div>
);

const UserProfile = ({ user, rankingData }) => {
    const totalLevel = (rankingData?.weight?.rank ?? 0) + (rankingData?.routine?.rank ?? 0) + (rankingData?.balance?.rank ?? 0);

    return (
        <div className="flex flex-col items-center p-8 text-center bg-card rounded-b-3xl shadow-lg">
            <div className="relative mb-4">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 blur-md opacity-75 animate-pulse"></div>
                <div className="relative h-28 w-28 rounded-full border-4 border-purple-400 p-1 bg-card">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-secondary">
                    <Award className="h-16 w-16 text-foreground" /> 
                    </div>
                </div>
            </div>
            <p className="font-bold text-purple-500 text-sm tracking-widest">KELAS</p>
            <h1 className="text-5xl font-bold text-foreground mt-1">{totalLevel}</h1>
            <h2 className="text-2xl font-semibold text-foreground/90 mt-2">{user.name}</h2>
            <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto">Kelas adalah capaian keseluruhan dari semua target. Terus tingkatkan untuk menjadi Pahlawan Lingkungan!</p>
        </div>
    );
};

const RankDetailCard = ({ category, data }) => {
    const details = categoryDetails[category];
    const Icon = details.icon;

    const formatValue = (value) => {
        if (details.unit === 'Rp') return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
        if (details.unit === 'kg') return `${value.toLocaleString()} kg`;
        return `${value}x`;
    };

    // Dynamically set text color based on category color for better contrast
    const colorClass = `text-${details.color}-500`; // e.g., text-green-500
    const bgClass = `bg-${details.color}-500/10`; // e.g., bg-green-500/10
    const gradientClass = `from-${details.color}-500 to-${details.color}-400`;

    return (
        <motion.div
            className="bg-card rounded-2xl p-5 border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex items-center space-x-4 py-2">
                <div className={`flex-shrink-0 p-3 ${bgClass} rounded-full`}>
                    <Award className={`h-8 w-8 ${colorClass}`} /> </div>
                <div className="flex-grow">
                    <p className="text-sm text-muted-foreground">{details.title}</p>
                    <h3 className="text-lg font-bold text-foreground">{data.name}</h3>
                </div>
            </div>
            <div className="mt-4">
                <div className="w-full bg-secondary rounded-full h-2.5">
                    <motion.div
                        className={`bg-gradient-to-r ${gradientClass} h-2.5 rounded-full`}
                        style={{ width: `0%` }}
                        animate={{ width: `${data.progress}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                    ></motion.div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                    <span className="font-semibold text-foreground/80">{formatValue(data.value)}</span>
                    <span className="font-bold">{data.progress}%</span>
                </div>
            </div>
            {data.nextRank ? (
                <div className="mt-4 p-3 bg-secondary rounded-lg">
                    <p className="text-xs text-purple-500 font-bold flex items-center"><Target className="h-3 w-3 mr-1.5"/> TARGET BERIKUTNYA</p>
                    <div className="flex items-center justify-between mt-1">
                        <p className="text-foreground font-semibold">{data.nextRank.name}</p>
                        <p className="text-purple-500 font-bold">{formatValue(data.nextRank.target)}</p>
                    </div>
                </div>
            ) : (
                <div className="mt-4 p-3 bg-green-500/10 rounded-lg text-center">
                    <p className="font-bold text-green-400 flex items-center justify-center"><Crown className="h-4 w-4 mr-2"/> PERINGKAT MAKSIMAL</p>
                </div>
            )}
        </motion.div>
    );
};

const RankingDetailsSkeleton = () => (
    <div className="p-6 space-y-4">
        <Skeleton className="h-28 rounded-2xl w-full" />
        <Skeleton className="h-28 rounded-2xl w-full" />
        <Skeleton className="h-28 rounded-2xl w-full" />
    </div>
);

// --- Main Component ---
export default function RankingDetails({ rankingData, loading: loadingRanking }: RankingDetailsProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      setLoadingUser(true);
      const token = localStorage.getItem('token');
      if (!token) {
          setLoadingUser(false);
          return;
      }
      try {
        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        }
      } catch (error) {
        console.error("Gagal mengambil data pengguna", error);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  const isLoading = loadingRanking || loadingUser || !userData || !rankingData;

  return (
    <div className="h-full bg-background text-foreground overflow-y-auto">
        {isLoading ? <UserProfileSkeleton /> : <UserProfile user={userData} rankingData={rankingData} />}

        <div className="p-6 space-y-4">
            <h2 className="text-xl font-bold text-foreground px-1">Rincian Pencapaian</h2>
            {isLoading ? (
                <RankingDetailsSkeleton />
            ) : (
                <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-2" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>
                    <RankDetailCard category="weight" data={rankingData.weight} />
                    <RankDetailCard category="routine" data={rankingData.routine} />
                    <RankDetailCard category="balance" data={rankingData.balance} />
                </motion.div>
            )}
        </div>
    </div>
  );
}
