'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { LogOut, MoreHorizontal, Menu, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'

interface NavItem {
  name: string
  value: string
  icon: React.ElementType
  bgColor: string
  hoverBgColor: string
  borderColor: string
  hoverBorderColor: string
  hidden?: boolean
}

interface BottomBarProps {
  navItems: NavItem[]
  activeTab: string
  onTabChange: (tab: string) => void
  onLogout: () => void
  onMenuClick: () => void
}

const MAX_VISIBLE_ITEMS = 3;

export default function BottomBar({ navItems, activeTab, onTabChange, onLogout, onMenuClick }: BottomBarProps) {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  const visibleItems = navItems.filter(item => !item.hidden).slice(0, MAX_VISIBLE_ITEMS);
  const moreItems = navItems.filter(item => !item.hidden).slice(MAX_VISIBLE_ITEMS);

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    setIsMoreMenuOpen(false);
  }
  
  const handleMenuClick = () => {
      onMenuClick();
      setIsMoreMenuOpen(false);
  }

  const handleLogoutClick = () => {
    setIsMoreMenuOpen(false);
    onLogout();
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }
  
  const BarButton = ({ item, isActive }: { item: NavItem, isActive: boolean }) => (
    <Button
      variant="ghost"
      className={`flex h-auto w-20 flex-col items-center justify-center rounded-none bg-transparent p-1 text-xs focus-visible:ring-0 group transition-all duration-200 hover:bg-transparent`}
      onClick={() => handleTabChange(item.value)}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-200 ${isActive ? `${item.hoverBgColor} ${item.hoverBorderColor}` : `${item.bgColor} ${item.borderColor}`} group-hover:${item.hoverBgColor} group-hover:${item.hoverBorderColor}`}>
        <item.icon className={`h-6 w-6 transition-all duration-200 ${isActive ? 'text-white' : 'text-slate-500'} ${isActive ? 'group-hover:text-white' : 'group-hover:text-slate-800'}`} strokeWidth={isActive ? 2.5 : 2} />
      </div>
      <span className={`text-xs mt-0 w-full truncate text-center font-bold transition-all duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground'} group-hover:text-primary`}>
        {item.name}
      </span>
    </Button>
  )

  return (
    <div className="fixed inset-x-0 bottom-6 z-40 mx-auto w-fit lg:hidden">
      <div className="flex h-auto items-center space-x-1 py-2 px-4 rounded-full border bg-background p-1 shadow-lg">
        {visibleItems.map((item) => (
          <BarButton key={item.value} item={item} isActive={activeTab === item.value} />
        ))}
        
        <Sheet open={isMoreMenuOpen} onOpenChange={setIsMoreMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="flex h-auto w-20 flex-col items-center justify-center rounded-none bg-transparent p-1 text-xs focus-visible:ring-0 hover:bg-transparent"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <MoreHorizontal className="h-6 w-6 text-muted-foreground" />
              </div>
              <span className="mt-0 w-full truncate text-center font-medium text-muted-foreground">
                Lainnya
              </span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-lg w-full">
            <SheetHeader className="mb-2">
              <SheetTitle className="text-center">Menu</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-1 gap-1">
              <Button
                variant="ghost"
                className="flex items-center justify-start p-4 text-md text-muted-foreground"
                onClick={handleMenuClick}
              >
                <Menu className="w-5 h-5 mr-4" />
                <span>Buka Menu</span>
              </Button>

              {moreItems.map((item) => (
                <Button
                  key={item.value}
                  variant={activeTab === item.value ? 'secondary' : 'ghost'}
                  className="flex items-center justify-start p-4 text-md"
                  onClick={() => handleTabChange(item.value)}
                >
                  <item.icon className="w-5 h-5 mr-4" />
                  <span>{item.name}</span>
                </Button>
              ))}

              <Button
                variant="ghost"
                className="flex items-center justify-start p-4 text-md text-muted-foreground"
                onClick={toggleTheme}
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="w-5 h-5 mr-4" />
                    <span>Mode Gelap</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-5 h-5 mr-4" />
                    <span>Mode Terang</span>
                  </>
                )}
              </Button>

              <Button
                  variant="ghost"
                  className="flex items-center justify-start p-4 text-md text-destructive"
                  onClick={handleLogoutClick}
                >
                  <LogOut className="w-5 h-5 mr-4" />
                  <span>Logout</span>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
