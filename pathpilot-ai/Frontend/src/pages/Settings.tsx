import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Trash2, LogOut, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { resetDemoData } from '../services/storageService';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import type { LearningFormat } from '../types';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

function Field({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
        {description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export default function Settings() {
  const { user, setUser, theme, toggleTheme, signOut, addToast, setPaths } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? '');
  const [email] = useState(user?.email ?? '');
  const [dailyTarget, setDailyTarget] = useState(user?.dailyTarget ?? 2);
  const [preferredFormat, setPreferredFormat] = useState<LearningFormat>(user?.preferredFormat ?? 'mixed');
  const [resetConfirm, setResetConfirm] = useState(false);
  const [nameEditing, setNameEditing] = useState(false);

  const handleSaveName = () => {
    if (!user) return;
    setUser({ ...user, name: name.trim() || user.name });
    setNameEditing(false);
    addToast({ type: 'success', title: 'Profile updated' });
  };

  const handleSavePrefs = () => {
    if (!user) return;
    setUser({ ...user, dailyTarget, preferredFormat });
    addToast({ type: 'success', title: 'Preferences saved' });
  };

  const handleReset = () => {
    resetDemoData();
    setPaths([]);
    if (user) setUser({ ...user, lessonsCompleted: 0, totalHoursLearned: 0, learningStreak: 0 });
    addToast({ type: 'info', title: 'Demo data reset', message: 'All learning paths and progress have been cleared.' });
    setResetConfirm(false);
  };

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your profile and learning preferences.</p>
      </div>

      {/* Demo notice */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-700 dark:text-amber-300">
          <strong>Demo mode active.</strong> This is not a real user account. Data is stored in browser localStorage only.
          <Badge color="amber" size="sm" variant="soft" className="ml-2 inline-flex">Interactive Demo</Badge>
        </div>
      </div>

      {/* Profile */}
      <Section title="Profile">
        <Field label="Display Name" description="How you appear in the app">
          {nameEditing ? (
            <div className="flex gap-2">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-32"
                id="settings-name-input"
              />
              <Button size="sm" onClick={handleSaveName} id="settings-save-name">Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setNameEditing(false)}>Cancel</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">{user?.name}</span>
              <button onClick={() => setNameEditing(true)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline" id="settings-edit-name">Edit</button>
            </div>
          )}
        </Field>
        <Field label="Email" description="Your account email (demo only)">
          <span className="text-sm text-gray-500 dark:text-gray-400">{email}</span>
        </Field>
        <Field label="Member Since">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'N/A'}
          </span>
        </Field>
      </Section>

      {/* Learning Preferences */}
      <Section title="Learning Preferences">
        <Field label="Daily Learning Target" description="Hours you aim to study each day">
          <select
            value={dailyTarget}
            onChange={e => setDailyTarget(Number(e.target.value))}
            className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            id="settings-daily-target"
          >
            {[0.5,1,1.5,2,3,4,5,6].map(h => <option key={h} value={h}>{h} hr{h !== 1 ? 's' : ''}/day</option>)}
          </select>
        </Field>
        <Field label="Preferred Format" description="Your default learning style">
          <select
            value={preferredFormat}
            onChange={e => setPreferredFormat(e.target.value as LearningFormat)}
            className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            id="settings-format"
          >
            <option value="video">Video Courses</option>
            <option value="articles">Articles & Docs</option>
            <option value="hands-on">Hands-on Projects</option>
            <option value="mixed">Mixed</option>
          </select>
        </Field>
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSavePrefs} id="settings-save-prefs">Save Preferences</Button>
        </div>
      </Section>

      {/* Theme */}
      <Section title="Appearance">
        <Field label="Theme" description="Choose between light and dark mode">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            <button
              onClick={() => theme === 'dark' && toggleTheme()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${theme === 'light' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
              id="settings-theme-light"
            >
              <Sun className="w-4 h-4" /> Light
            </button>
            <button
              onClick={() => theme === 'light' && toggleTheme()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${theme === 'dark' ? 'bg-gray-700 shadow-sm text-white' : 'text-gray-500 dark:text-gray-400'}`}
              id="settings-theme-dark"
            >
              <Moon className="w-4 h-4" /> Dark
            </button>
          </div>
        </Field>
      </Section>

      {/* Danger Zone */}
      <Section title="Danger Zone">
        <Field label="Reset Demo Data" description="Clear all learning paths and progress. This cannot be undone.">
          {resetConfirm ? (
            <div className="flex gap-2">
              <span className="text-xs text-red-600 dark:text-red-400 self-center">Are you sure?</span>
              <Button size="sm" variant="danger" onClick={handleReset} id="settings-confirm-reset">Yes, Reset</Button>
              <Button size="sm" variant="ghost" onClick={() => setResetConfirm(false)}>Cancel</Button>
            </div>
          ) : (
            <Button size="sm" variant="danger" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => setResetConfirm(true)} id="settings-reset-btn">Reset Data</Button>
          )}
        </Field>
        <Field label="Sign Out" description="End your demo session">
          <Button size="sm" variant="outline" leftIcon={<LogOut className="w-4 h-4" />} onClick={handleSignOut} id="settings-signout-btn">Sign Out</Button>
        </Field>
      </Section>
    </div>
  );
}
