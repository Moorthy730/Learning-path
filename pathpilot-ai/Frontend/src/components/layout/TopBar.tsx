import React from 'react';
import { Menu, Moon, Sun } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import NotificationBell from '../notifications/NotificationBell';

interface TopBarProps { title?: string; }

export default function TopBar({ title }: TopBarProps) {
  const { setSidebarOpen, sidebarOpen, theme, toggleTheme, user } = useApp();

  return (
    <header className="h-16 bg-white dark:bg-[#1c0f0d] border-b border-[#F6C77B]/30 dark:border-[#5c2e20]/40 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-[#FFF0EE] dark:hover:bg-[#2a1410] text-[#8B5447] dark:text-[#F6C77B]/60 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title && (
          <h1 className="text-lg font-semibold text-[#542E28] dark:text-[#F9E3B5] hidden md:block">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-[#FFF0EE] dark:hover:bg-[#2a1410] text-[#8B5447] dark:text-[#F6C77B]/60 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
        <NotificationBell />
        {user && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D85C4A] to-[#F3A65A] flex items-center justify-center ml-1 shadow-sm shadow-[#D85C4A]/30">
            <span className="text-white text-xs font-bold">{user.name.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>
    </header>
  );
}
