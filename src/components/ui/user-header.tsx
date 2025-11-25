'use client'

import { useState, useEffect, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import NotificationBell from "@/components/ui/NotificationBell"
import TypingAnimation from "@/components/ui/TypingAnimation"

interface UserHeaderProps {
  user: {
    name?: string | null;
    image?: string | null;
  } | null;
}

function getInitials(name: string) {
  if (!name) return '';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2).toUpperCase();
}

export function UserHeader({ user }: UserHeaderProps) {
  const userName = user?.name || 'Pengguna';
  const firstName = userName.split(' ')[0]; // Get the first name
  const userImage = user?.image;
  const initials = getInitials(userName);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return "Selamat Pagi...";
    if (hour < 15) return "Selamat Siang...";
    if (hour < 19) return "Selamat Sore...";
    return "Selamat Malam...";
  };

  const funFacts = useMemo(() => [ 
    "EcoNow",
    "Hello Hai..."
  ], []);

  const [textIndex, setTextIndex] = useState(0);
  const displayTexts = useMemo(() => [getGreeting(), ...funFacts], [funFacts]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prevIndex) => (prevIndex + 1) % displayTexts.length);
    }, 10000); // Rotate text every 20 seconds

    return () => clearInterval(interval);
  }, [displayTexts.length]);

  return (
    <div className="flex items-start justify-between mb-8">
      <div style={{ minHeight: '60px' }}>
        <TypingAnimation key={textIndex} text={displayTexts[textIndex]} className="text-xl md:text-2xl font-bold" />
        <p className="text-xl text-muted-foreground">{firstName}</p>
      </div>
      <div className="flex items-center gap-2">
        {user && <NotificationBell />} 
        <Avatar className="h-12 w-12">
          {userImage && <AvatarImage src={userImage} alt={userName} />}
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
      </div>
    </div>
  )
}
