import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

/**
 * DemoEntry — allows users to enter the demo without registering.
 * Automatically signs them in as a demo user and redirects to dashboard.
 */
export default function DemoEntry() {
  const { signIn, addToast } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    signIn('Demo User', 'demo@pathpilot.ai', true);
    addToast({ type: 'info', title: 'Exploring demo mode', message: 'You are viewing PathPilot AI as a demo user.' });
    navigate('/dashboard', { replace: true });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0EE] to-[#FFF8EE] dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D85C4A] to-[#F3A65A] flex items-center justify-center mx-auto mb-4 animate-pulse shadow-lg">
          <Navigation className="w-8 h-8 text-white" />
        </div>
        <p className="text-gray-600 dark:text-gray-400">Loading demo...</p>
      </div>
    </div>
  );
}
