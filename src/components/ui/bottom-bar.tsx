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
  hidden?: boolean
}

interface BottomBarProps {
  navItems: NavItem[]
  activeTab: string
  onTabChange: (tab: string) => void
  onLogout: () => void
  onMenuClick: () => void
}

// We can show a maximum of 4 items directly in the bar.
// The 5th slot will always be the "More" button.
const MAX_VISIBLE_ITEMS = 3;

export default function BottomBar({ navItems, activeTab, onTabChange, onLogout, onMenuClick }: BottomBarProps) {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  const visibleItems = navItems.filter(item => !item.hidden).slice(0, MAX_VISIBLE_ITEMS);
  const moreItems = navItems.filter(item => !item.hidden).slice(MAX_VISIBLE_ITEMS);

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    setIsMoreMenuOpen(false); // Close sheet on selection
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
        className={`flex-1 flex flex-col items-center justify-center h-full rounded-none text-xs p-1 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
        onClick={() => handleTabChange(item.value)}
      >
        <item.icon className="h-5 w-5 mb-1" />
        <span className="w-full text-center truncate">{item.name}</span>
      </Button>
  )

  return (
    <div className="fixed bottom-0 left-0 z-40 w-full h-16 bg-background border-t lg:hidden">
      <div className="flex h-full w-full mx-auto">
        {visibleItems.map((item) => (
          <BarButton key={item.value} item={item} isActive={activeTab === item.value} />
        ))}
        
        <Sheet open={isMoreMenuOpen} onOpenChange={setIsMoreMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" className="flex-1 flex flex-col items-center justify-center h-full rounded-none text-xs p-1 text-muted-foreground">
              <MoreHorizontal className="h-5 w-5 mb-1" />
              <span className="w-full text-center">Lainnya</span>
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
