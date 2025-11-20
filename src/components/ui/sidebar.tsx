'use client'

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Button } from '@/components/ui/button'
import { LogOut, Settings, X, ChevronLeft, Menu, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'

interface NavItem {
  name: string
  value: string
  icon: React.ElementType
  hidden?: boolean
}

interface SidebarProps {
  user: any
  navItems: NavItem[]
  activeTab: string
  onTabChange: (tab: string) => void
  onLogout: () => void
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export default function Sidebar({ user, navItems, activeTab, onTabChange, onLogout, isOpen, setIsOpen }: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsOpen]);

  const NavContent = () => (
    <div className={"flex flex-col h-full bg-white dark:bg-gray-800 border-r dark:border-gray-700 w-full"}>
      <div className="p-4 flex items-center justify-between border-b dark:border-gray-700">
         {isOpen && (
            <div className="text-center">
                <h2 className="text-lg font-semibold text-foreground dark:text-white">{user.name}</h2>
                <p className="text-xs text-muted-foreground dark:text-gray-400">{user.role}</p>
            </div>
        )}
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="hidden lg:flex">
            {isOpen ? <ChevronLeft /> : <Menu />}
        </Button>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.filter(item => !item.hidden).map((item) => (
          <Button
            key={item.value}
            variant={activeTab === item.value ? 'secondary' : 'ghost'}
            className={`w-full text-sm ${isOpen ? 'justify-start' : 'justify-center'}`}
            onClick={() => onTabChange(item.value)}
            title={isOpen ? '' : item.name}
          >
            <item.icon className={isOpen ? 'mr-3 h-4 w-4' : 'h-5 w-5'} />
            {isOpen && item.name}
          </Button>
        ))}
      </nav>
      <div className="p-2 border-t dark:border-gray-700 space-y-1">
        <Button variant="ghost" className={`w-full text-sm ${isOpen ? 'justify-start' : 'justify-center'}`} title={isOpen ? '' : 'Pengaturan'} onClick={() => onTabChange("settings")}>
          <Settings className={isOpen ? 'mr-3 h-4 w-4' : 'h-5 w-5'} />
          {isOpen && 'Pengaturan'}
        </Button>
        <Button variant="ghost" className={`w-full text-sm ${isOpen ? 'justify-start' : 'justify-center'}`} onClick={toggleTheme} title={isOpen ? '' : (theme === 'light' ? 'Dark Mode' : 'Light Mode')}>
            {theme === 'light' ? (
                <Moon className={isOpen ? 'mr-3 h-4 w-4' : 'h-5 w-5'} />
            ) : (
                <Sun className={isOpen ? 'mr-3 h-4 w-4' : 'h-5 w-5'} />
            )}
          {isOpen && (theme === 'light' ? 'Dark Mode' : 'Light Mode')}
        </Button>
        <Button variant="ghost" className={`w-full text-sm text-red-500 hover:text-red-600 ${isOpen ? 'justify-start' : 'justify-center'}`} onClick={onLogout} title={isOpen ? '' : 'Logout'}>
          <LogOut className={isOpen ? 'mr-3 h-4 w-4' : 'h-5 w-5'} />
          {isOpen && 'Logout'}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar (off-canvas) */}
      <Transition.Root show={isOpen && isMobile} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setIsOpen}>
            <Transition.Child as={Fragment} enter="transition-opacity ease-linear duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="transition-opacity ease-linear duration-300" leaveFrom="opacity-100" leaveTo="opacity-0">
                <div className="fixed inset-0 bg-black/40" />
            </Transition.Child>
            <div className="fixed inset-0 flex">
                <Transition.Child as={Fragment} enter="transition ease-in-out duration-300 transform" enterFrom="-translate-x-full" enterTo="translate-x-0" leave="transition ease-in-out duration-300 transform" leaveFrom="translate-x-0" leaveTo="-translate-x-full">
                    <Dialog.Panel className="relative flex w-full max-w-xs flex-1">
                         <NavContent />
                    </Dialog.Panel>
                </Transition.Child>
                 <div className="w-14 flex-shrink-0" aria-hidden="true"></div>
            </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className={`hidden lg:flex lg:flex-shrink-0 h-screen sticky top-0 transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`}>
        <NavContent /> 
      </div>
    </>
  )
}
