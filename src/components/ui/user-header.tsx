'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface UserHeaderProps {
  user: {
    name?: string | null;
    image?: string | null;
  };
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2).toUpperCase();
}

export function UserHeader({ user }: UserHeaderProps) {
  const userName = user?.name || 'Pengguna';
  const userImage = user?.image;
  const initials = getInitials(userName);

  return (
    <div className="flex items-center gap-4 mb-8">
      <Avatar className="h-16 w-16">
        {userImage && <AvatarImage src={userImage} alt={userName} />}
        <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
      </Avatar>
      <div>
        <h1 className="text-2xl font-bold">Selamat datang kembali,</h1>
        <p className="text-xl text-muted-foreground">{userName}</p>
      </div>
    </div>
  )
}
