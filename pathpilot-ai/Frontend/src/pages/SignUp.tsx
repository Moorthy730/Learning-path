import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Navigation, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Button from '../components/ui/Button';

export default function SignUp() {
  const { signIn, addToast } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required.';
    if (!email) newErrors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email.';
    if (!password) newErrors.password = 'Password is required.';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password.';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    signIn(name.trim(), email, false);
    addToast({ type: 'success', title: 'Account created!', message: 'Welcome to PathPilot AI. Let\'s build your roadmap!' });
    setLoading(false);
    navigate('/onboarding');
  };

  const handleDemoEntry = () => {
    signIn('Demo User', 'demo@pathpilot.ai', true);
    addToast({ type: 'info', title: 'Exploring demo mode' });
    navigate('/dashboard');
  };

  const Field = ({ id, label, type = 'text', value, onChange, error, placeholder, rightElement }: {
    id: string; label: string; type?: string; value: string;
    onChange: (v: string) => void; error?: string; placeholder?: string; rightElement?: React.ReactNode;
  }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      <div className="relative">
        <input
          id={id} type={type} value={value} placeholder={placeholder}
          onChange={e => { onChange(e.target.value); setErrors(prev => ({ ...prev, [id.split('-').pop()!]: '' })); }}
          className={`w-full px-4 py-2.5 border rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${rightElement ? 'pr-11' : ''} ${error ? 'border-red-400 dark:border-red-600' : 'border-gray-200 dark:border-gray-700'}`}
        />
        {rightElement && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>}
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-lg">PathPilot AI</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Start your personalized learning journey today.</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl p-8">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl p-3 mb-6 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              <strong>Demo mode:</strong> Data is stored locally in your browser. No real account is created.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Field id="signup-name" label="Full Name" value={name} onChange={setName} error={errors.name} placeholder="Alex Johnson" />
            <Field id="signup-email" label="Email address" type="email" value={email} onChange={setEmail} error={errors.email} placeholder="you@example.com" />
            <Field
              id="signup-password" label="Password" type={showPassword ? 'text' : 'password'}
              value={password} onChange={setPassword} error={errors.password} placeholder="Min 6 characters"
              rightElement={
                <button type="button" onClick={() => setShowPassword(v => !v)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label={showPassword ? 'Hide' : 'Show'}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
            <Field
              id="signup-confirmPassword" label="Confirm Password" type={showConfirm ? 'text' : 'password'}
              value={confirmPassword} onChange={setConfirmPassword} error={errors.confirmPassword} placeholder="Repeat your password"
              rightElement={
                <button type="button" onClick={() => setShowConfirm(v => !v)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label={showConfirm ? 'Hide' : 'Show'}>
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
            <div className="pt-2">
              <Button type="submit" fullWidth loading={loading} size="lg" id="signup-btn">
                Create Account & Get My Roadmap
              </Button>
            </div>
          </form>

          <div className="mt-4 relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-gray-800" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white dark:bg-gray-900 px-3 text-gray-400">or</span></div>
          </div>

          <button
            id="signup-demo-btn"
            onClick={handleDemoEntry}
            className="mt-4 w-full py-2.5 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            Explore Demo (no account needed)
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Already have an account?{' '}
          <Link to="/signin" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
