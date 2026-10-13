import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Navigation, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Button from '../components/ui/Button';

export default function SignIn() {
  const { signIn, addToast } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!email) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
    if (!password || password.length < 6) return 'Password must be at least 6 characters.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);

    try {
      // Try real Supabase authentication first
      const { authService } = await import('../services/backendService');
      await authService.signIn(email, password);
      const name = email.split('@')[0];
      signIn(name.charAt(0).toUpperCase() + name.slice(1), email, false);
      addToast({ type: 'success', title: 'Welcome back!', message: 'You have signed in successfully.' });
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // If Supabase is not configured, fall back to demo mode
      if (msg.includes('placeholder') || msg.includes('fetch') || msg.includes('NetworkError')) {
        const name = email.split('@')[0];
        signIn(name.charAt(0).toUpperCase() + name.slice(1), email, false);
        addToast({ type: 'success', title: 'Welcome back! (Demo)', message: 'Running in demo mode.' });
        navigate('/dashboard');
      } else {
        setError(msg || 'Sign in failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoEntry = () => {
    signIn('Demo User', 'demo@pathpilot.ai', true);
    addToast({ type: 'info', title: 'Exploring demo mode', message: 'You are signed in as a demo user.' });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0EE] via-[#FFFAF5] to-[#FFF8EE] dark:from-[#140a08] dark:via-[#1c0f0d] dark:to-[#140a08] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D85C4A] to-[#F3A65A] flex items-center justify-center shadow-md">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-lg">PathPilot AI</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Sign in to continue your learning journey.</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-[#1c0f0d] rounded-2xl border border-[#F6C77B]/40 dark:border-[#5c2e20]/50 shadow-xl shadow-[#D85C4A]/5 p-8">
          {/* Demo notice */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl p-3 mb-6 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              <strong>Demo mode:</strong> This is not production authentication. Data is stored locally in your browser only.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <div>
              <label htmlFor="signin-email" className="block text-sm font-medium text-[#542E28] dark:text-[#F6C77B]/80 mb-1.5">Email address</label>
              <input
                id="signin-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#2a1410] text-gray-900 dark:text-gray-100 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D85C4A] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="signin-password" className="block text-sm font-medium text-[#542E28] dark:text-[#F6C77B]/80 mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="signin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-11 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#2a1410] text-gray-900 dark:text-gray-100 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D85C4A] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" fullWidth loading={loading} size="lg" id="signin-btn">
              Sign In
            </Button>
          </form>

          <div className="mt-4 relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-gray-800" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white dark:bg-[#1c0f0d] px-3 text-gray-400">or</span></div>
          </div>

          <button
            id="explore-demo-btn"
            onClick={handleDemoEntry}
            className="mt-4 w-full py-2.5 rounded-xl border border-dashed border-[#F3A65A]/60 dark:border-[#5c2e20] text-[#D85C4A] dark:text-[#E9825C] text-sm font-medium hover:bg-[#FFF0EE] dark:hover:bg-[#D85C4A]/10 transition-colors"
          >
            Explore Demo (no account needed)
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[#D85C4A] dark:text-[#E9825C] font-semibold hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
