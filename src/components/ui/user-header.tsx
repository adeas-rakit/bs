'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import NotificationBell from "@/components/ui/NotificationBell"

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
  const userImage = user?.image;
  const initials = getInitials(userName);

  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold">Hello hai...</h1>
        <p className="text-xl text-muted-foreground">{userName}</p>
      </div>
      <div className="flex items-center gap-2">
        {/* Conditionally render NotificationBell only when the user object exists */}
        {user && <NotificationBell />} 
        <Avatar className="h-12 w-12">
          {userImage && <AvatarImage src={userImage} alt={userName} />}
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
      </div>
    </div>
  )
}
