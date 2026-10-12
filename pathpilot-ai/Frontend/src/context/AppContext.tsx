import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserProfile, LearningPath, Toast } from '../types';
import * as storage from '../services/storageService';

interface AppContextValue {
  user: UserProfile | null;
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
  signIn: (name: string, email: string, isDemo?: boolean) => void;
  signOut: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserProfile | null>(() => storage.getUser());
  const [paths, setPathsState] = useState<LearningPath[]>(() => storage.getLearningPaths());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => storage.getTheme());
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const setUser = useCallback((u: UserProfile | null) => {
    setUserState(u);
    if (u) storage.saveUser(u);
  }, []);

  const setPaths = useCallback((p: LearningPath[]) => {
    setPathsState(p);
    storage.saveLearningPaths(p);
  }, []);

  const addPath = useCallback((path: LearningPath) => {
    setPathsState(prev => {
      const next = [path, ...prev];
      storage.saveLearningPaths(next);
      return next;
    });
  }, []);

  const updatePath = useCallback((updated: LearningPath) => {
    setPathsState(prev => {
      const next = prev.map(p => (p.id === updated.id ? updated : p));
      storage.saveLearningPaths(next);
      return next;
    });
  }, []);

  const deletePath = useCallback((id: string) => {
    setPathsState(prev => {
      const next = prev.filter(p => p.id !== id);
      storage.saveLearningPaths(next);
      return next;
    });
  }, []);

  const toggleLesson = useCallback((pathId: string, lessonId: string) => {
    const updated = storage.toggleLessonCompletion(pathId, lessonId);
    if (updated) {
      setPathsState(prev => prev.map(p => (p.id === pathId ? updated : p)));
      const freshUser = storage.getUser();
      if (freshUser) setUserState(freshUser);
    }
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      storage.setTheme(next);
      return next;
    });
  }, []);

  const signIn = useCallback((name: string, email: string, isDemo = false) => {
    const existingUser = storage.getUser();
    if (existingUser && existingUser.email === email) {
      setUserState(existingUser);
    } else {
      const newUser = storage.createDemoUser(name, email);
      newUser.isDemo = isDemo;
      storage.saveUser(newUser);
      setUserState(newUser);
    }
    setPathsState(storage.getLearningPaths());
  }, []);

  const signOut = useCallback(() => {
    storage.signOut();
    setUserState(null);
  }, []);

  return (
    <AppContext.Provider value={{
      user, paths, toasts, theme, sidebarOpen,
      setUser, setPaths, addPath, updatePath, deletePath,
      toggleLesson, addToast, removeToast, toggleTheme, setSidebarOpen,
      signIn, signOut,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
