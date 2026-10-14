import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Navigation, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Button from '../components/ui/Button';

// ── Field component defined at module scope ───────────────────────────────────
// IMPORTANT: This component MUST be defined outside of SignUp (or any other
// parent component). If it were defined inside SignUp's function body, React
// would see a brand-new component type on every render, unmount the old <input>
// and mount a fresh one — losing focus after each keystroke.
interface FieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  onClearError?: () => void;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
  rightElement?: React.ReactNode;
}

function Field({
  id, label, type = 'text', value, onChange, onClearError,
  error, placeholder, autoComplete, rightElement,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[#542E28] dark:text-[#F6C77B]/80 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={e => {
            onChange(e.target.value);
            onClearError?.();
          }}
          className={`w-full px-4 py-2.5 border rounded-xl bg-white dark:bg-[#2a1410] text-gray-900 dark:text-gray-100 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D85C4A] focus:border-transparent transition-all ${rightElement ? 'pr-11' : ''} ${error ? 'border-red-400 dark:border-red-600' : 'border-gray-200 dark:border-gray-700'}`}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function SignUp() {
  const { addToast } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearFieldError = (field: string) =>
    setErrors(prev => ({ ...prev, [field]: '' }));

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

    try {
      // Attempt real Supabase signup
      const { authService } = await import('../services/backendService');
      const result = await authService.signUp(email, password, name.trim());
      if (result.session) {
        addToast({ type: 'success', title: 'Account created!', message: "Welcome to PathPilot AI. Let's build your roadmap!" });
        navigate('/onboarding');
      } else {
        addToast({ type: 'success', title: 'Check your email', message: 'Confirm your email address, then sign in to continue.' });
        navigate('/signin');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrors({ name: '', email: msg || 'Sign up failed. Please try again.', password: '', confirmPassword: '' });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0EE] via-white to-[#FFF8EE] dark:from-[#140a08] dark:via-[#1c0f0d] dark:to-[#140a08] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D85C4A] to-[#F3A65A] flex items-center justify-center shadow-md">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-lg">PathPilot AI</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Start your personalized learning journey today.</p>
        </div>

        <div className="bg-white dark:bg-[#1c0f0d] rounded-2xl border border-[#F6C77B]/40 dark:border-[#5c2e20]/50 shadow-xl shadow-[#D85C4A]/5 p-8">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Field
              id="signup-name"
              label="Full Name"
              value={name}
              onChange={setName}
              onClearError={() => clearFieldError('name')}
              error={errors.name}
              placeholder="Alex Johnson"
              autoComplete="name"
            />
            <Field
              id="signup-email"
              label="Email address"
              type="email"
              value={email}
              onChange={setEmail}
              onClearError={() => clearFieldError('email')}
              error={errors.email}
              placeholder="you@example.com"
              autoComplete="email"
            />
            <Field
              id="signup-password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={setPassword}
              onClearError={() => clearFieldError('password')}
              error={errors.password}
              placeholder="Min 6 characters"
              autoComplete="new-password"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
            <Field
              id="signup-confirmPassword"
              label="Confirm Password"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={setConfirmPassword}
              onClearError={() => clearFieldError('confirmPassword')}
              error={errors.confirmPassword}
              placeholder="Repeat your password"
              autoComplete="new-password"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
            <div className="pt-2">
              <Button type="submit" fullWidth loading={loading} size="lg" id="signup-btn">
                Create Account &amp; Get My Roadmap
              </Button>
            </div>
          </form>


        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Already have an account?{' '}
          <Link to="/signin" className="text-[#D85C4A] dark:text-[#E9825C] font-semibold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
