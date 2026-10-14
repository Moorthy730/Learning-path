import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { UserProfile, LearningPath, Toast } from '../types';
import * as storage from '../services/storageService';
import { supabase } from '../services/supabaseClient';

interface AppContextValue {
  user: UserProfile | null;
  authReady: boolean;
  paths: LearningPath[];
  toasts: Toast[];
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  setUser: (user: UserProfile | null) => void;
  setPaths: (paths: LearningPath[]) => void;
  addPath: (path: LearningPath) => void;
  updatePath: (path: LearningPath) => void;
  deletePath: (id: string) => void;
  toggleLesson: (pathId: string, lessonId: string) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function profileFromAuth(user: SupabaseUser): UserProfile {
  const metadata = user.user_metadata ?? {};
  const name = metadata.full_name || metadata.name || user.email?.split('@')[0] || 'Learner';
  return {
    id: user.id,
    name,
    email: user.email ?? '',
    joinedAt: user.created_at,
    learningStreak: 0,
    totalHoursLearned: 0,
    lessonsCompleted: 0,
    preferredFormat: 'mixed',
    dailyTarget: 2,
    theme: storage.getTheme(),
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [paths, setPathsState] = useState<LearningPath[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => storage.getTheme());
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    let active = true;
    const applyAuthUser = (authUser: SupabaseUser | null) => {
      if (!active) return;
      if (!authUser) {
        setUserState(null);
        setPathsState([]);
      } else {
        const profile = profileFromAuth(authUser);
        setUserState(profile);
        setPathsState(storage.getLearningPaths(profile.email));
      }
      setAuthReady(true);
    };

    supabase.auth.getSession()
      .then(({ data }) => applyAuthUser(data.session?.user ?? null))
      .catch(() => applyAuthUser(null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applyAuthUser(session?.user ?? null);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const setUser = useCallback((profile: UserProfile | null) => setUserState(profile), []);
  const setPaths = useCallback((next: LearningPath[]) => {
    setPathsState(next);
    if (user?.email) storage.saveLearningPaths(next, user.email);
  }, [user?.email]);
  const addPath = useCallback((path: LearningPath) => {
    setPathsState(previous => {
      const next = [path, ...previous];
      if (user?.email) storage.saveLearningPaths(next, user.email);
      return next;
    });
  }, [user?.email]);
  const updatePath = useCallback((updated: LearningPath) => {
    setPathsState(previous => {
      const next = previous.map(path => path.id === updated.id ? updated : path);
      if (user?.email) storage.saveLearningPaths(next, user.email);
      return next;
    });
  }, [user?.email]);
  const deletePath = useCallback((id: string) => {
    setPathsState(previous => {
      const next = previous.filter(path => path.id !== id);
      if (user?.email) storage.saveLearningPaths(next, user.email);
      return next;
    });
  }, [user?.email]);
  const toggleLesson = useCallback((pathId: string, lessonId: string) => {
    if (!user?.email) return;
    const updated = storage.toggleLessonCompletion(pathId, lessonId, user.email);
    if (updated) setPathsState(previous => previous.map(path => path.id === pathId ? updated : path));
  }, [user?.email]);
  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}`;
    setToasts(previous => [...previous, { ...toast, id }]);
    setTimeout(() => setToasts(previous => previous.filter(item => item.id !== id)), 4000);
  }, []);
  const removeToast = useCallback((id: string) => setToasts(previous => previous.filter(toast => toast.id !== id)), []);
  const toggleTheme = useCallback(() => {
    setThemeState(previous => {
      const next = previous === 'light' ? 'dark' : 'light';
      storage.setTheme(next);
      return next;
    });
  }, []);
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    storage.signOut();
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    import('../services/backendService').then(async ({ pathsService, backendPathToFrontend }) => {
      const summaries = await pathsService.list();
      const fullPaths = await Promise.all(summaries.map(summary => pathsService.get(summary.id).then(backendPathToFrontend)));
      if (!cancelled) {
        setPathsState(fullPaths);
        storage.saveLearningPaths(fullPaths, user.email);
      }
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [user?.id, user?.email]);

  return <AppContext.Provider value={{ user, authReady, paths, toasts, theme, sidebarOpen, setUser, setPaths, addPath, updatePath, deletePath, toggleLesson, addToast, removeToast, toggleTheme, setSidebarOpen, signOut }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
