import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Sparkles, Compass,
  BarChart2, Settings, LogOut, ChevronLeft, ChevronRight,
  Navigation
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/paths',     icon: BookOpen,        label: 'My Learning Paths' },
  { to: '/onboarding',icon: Sparkles,        label: 'Generate New Path' },
  { to: '/careers',   icon: Compass,         label: 'Explore Careers' },
  { to: '/analytics', icon: BarChart2,       label: 'Progress Analytics' },
  { to: '/settings',  icon: Settings,        label: 'Settings' },
];

export default function Sidebar() {
  const { user, sidebarOpen, setSidebarOpen, signOut } = useApp();
  const navigate = useNavigate();

  const handleSignOut = () => { signOut(); navigate('/'); };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-[#542E28]/30 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full z-30 flex flex-col
        bg-white dark:bg-[#1c0f0d]
        border-r border-[#F6C77B]/30 dark:border-[#5c2e20]/40
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'w-64' : 'w-16'}
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-[#F6C77B]/25 dark:border-[#5c2e20]/40 flex-shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-[#D85C4A] to-[#F3A65A] flex items-center justify-center shadow-sm shadow-[#D85C4A]/30">
              <Navigation className="w-4 h-4 text-white" />
            </div>
            {sidebarOpen && (
              <span className="font-bold text-[#542E28] dark:text-[#F9E3B5] whitespace-nowrap text-sm">
                PathPilot AI
              </span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto hidden lg:flex items-center justify-center w-6 h-6 rounded-md hover:bg-[#FFF0EE] dark:hover:bg-[#3a1c14] text-[#8B5447] dark:text-[#F6C77B]/60 transition-colors"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-gradient-to-r from-[#D85C4A]/10 to-[#F3A65A]/10 text-[#D85C4A] dark:text-[#F3A65A] border border-[#F3A65A]/20'
                    : 'text-[#542E28]/70 dark:text-[#F6C77B]/60 hover:bg-[#FFF0EE] dark:hover:bg-[#2a1410] hover:text-[#D85C4A] dark:hover:text-[#F3A65A]'
                }`
              }
              title={!sidebarOpen ? label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User & Sign Out */}
        <div className="border-t border-[#F6C77B]/25 dark:border-[#5c2e20]/40 p-2 flex-shrink-0">
          {sidebarOpen && user && (
            <div className="flex items-center gap-3 px-3 py-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D85C4A] to-[#F3A65A] flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-white text-xs font-bold">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#542E28] dark:text-[#F9E3B5] truncate">{user.name}</p>
                <p className="text-xs text-[#8B5447] dark:text-[#F6C77B]/60 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-[#8B5447]/80 dark:text-[#F6C77B]/50 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all"
            title={!sidebarOpen ? 'Sign Out' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
