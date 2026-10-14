/**
 * storageService.ts
 * localStorage persistence layer for PathPilot AI demo.
 * NOTE: This is demo-only storage. No real authentication or sensitive data is stored.
 */
import type { LearningPath, UserProfile } from '../types';

const KEYS = {
  USER: 'pathpilot_user',
  PATHS: 'pathpilot_paths',
  SETTINGS: 'pathpilot_settings',
  ONBOARDING: 'pathpilot_onboarding',
} as const;

// ─── Duration Parser ──────────────────────────────────────────────────────────
export function parseDurationToMinutes(duration?: string): number {
  if (!duration) return 30;
  const d = duration.toLowerCase().trim();
  const hrMatch = d.match(/(\d+(?:\.\d+)?)\s*h/);
  const minMatch = d.match(/(\d+(?:\.\d+)?)\s*m/);
  let mins = 0;
  if (hrMatch) mins += parseFloat(hrMatch[1]) * 60;
  if (minMatch) mins += parseFloat(minMatch[1]);
  if (!hrMatch && !minMatch) {
    const num = parseFloat(d);
    if (!isNaN(num)) mins += num * 60;
    else mins += 30;
  }
  return mins;
}

// ─── Safe JSON Parse ──────────────────────────────────────────────────────────
function safeGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage quota exceeded — fail silently
  }
}

// ─── User Storage Key ─────────────────────────────────────────────────────────
function getPathsStorageKey(emailOrId?: string): string {
  const activeUser = emailOrId || safeGet<UserProfile>(KEYS.USER)?.email;
  if (!activeUser) return KEYS.PATHS;
  return `${KEYS.PATHS}_${activeUser.toLowerCase().trim()}`;
}

// ─── User ─────────────────────────────────────────────────────────────────────
export function getUser(): UserProfile | null {
  const user = safeGet<UserProfile>(KEYS.USER);
  if (!user) return null;

  // Sanitize stale placeholder stats if user actually has no completed lessons
  const paths = getLearningPaths(user.email);
  const actualCompleted = paths.reduce((acc, p) => {
    const count = p.stages?.reduce((sAcc, s) => sAcc + s.modules.reduce((mAcc, m) => mAcc + m.lessons.filter(l => l.completed).length, 0), 0) ?? p.completedLessons;
    return acc + (count || 0);
  }, 0);

  if (paths.length === 0 || actualCompleted === 0) {
    if (user.lessonsCompleted > 0 || user.totalHoursLearned > 0 || user.learningStreak > 0) {
      user.lessonsCompleted = 0;
      user.totalHoursLearned = 0;
      user.learningStreak = 0;
      safeSet(KEYS.USER, user);
    }
  }

  return user;
}

export function saveUser(user: UserProfile): void {
  safeSet(KEYS.USER, user);
}

export function createDemoUser(name = 'Demo User', email = 'demo@pathpilot.ai'): UserProfile {
  const user: UserProfile = {
    id: `user-${Date.now()}`,
    name,
    email,
    joinedAt: new Date().toISOString(),
    learningStreak: 0,
    totalHoursLearned: 0,
    lessonsCompleted: 0,
    preferredFormat: 'mixed',
    dailyTarget: 2,
    theme: 'light',
    isDemo: true,
  };
  saveUser(user);
  return user;
}

export function signOut(): void {
  localStorage.removeItem(KEYS.USER);
}

// ─── Learning Paths (Per-User Isolated) ────────────────────────────────────────
export function getLearningPaths(userEmail?: string): LearningPath[] {
  const key = getPathsStorageKey(userEmail);
  const userPaths = safeGet<LearningPath[]>(key);
  if (userPaths !== null) return userPaths;

  // If no user-specific key exists, check if legacy global key exists for demo user
  const activeEmail = userEmail || safeGet<UserProfile>(KEYS.USER)?.email;
  if (activeEmail === 'demo@pathpilot.ai') {
    const legacy = safeGet<LearningPath[]>(KEYS.PATHS);
    if (legacy) {
      safeSet(key, legacy);
      return legacy;
    }
  }

  return [];
}

export function saveLearningPaths(paths: LearningPath[], userEmail?: string): void {
  const key = getPathsStorageKey(userEmail);
  safeSet(key, paths);
}

export function addLearningPath(path: LearningPath, userEmail?: string): void {
  const paths = getLearningPaths(userEmail);
  paths.unshift(path);
  saveLearningPaths(paths, userEmail);
}

export function updateLearningPath(updated: LearningPath, userEmail?: string): void {
  const paths = getLearningPaths(userEmail).map(p => (p.id === updated.id ? updated : p));
  saveLearningPaths(paths, userEmail);
}

export function deleteLearningPath(id: string, userEmail?: string): void {
  const paths = getLearningPaths(userEmail).filter(p => p.id !== id);
  saveLearningPaths(paths, userEmail);
}

export function getLearningPathById(id: string, userEmail?: string): LearningPath | null {
  return getLearningPaths(userEmail).find(p => p.id === id) ?? null;
}

// ─── Lesson Completion ─────────────────────────────────────────────────────────
export function toggleLessonCompletion(pathId: string, lessonId: string, userEmail?: string): LearningPath | null {
  const paths = getLearningPaths(userEmail);
  const path = paths.find(p => p.id === pathId);
  if (!path) return null;

  let completedCount = 0;
  path.stages = path.stages.map(stage => ({
    ...stage,
    modules: stage.modules.map(mod => {
      const updatedLessons = mod.lessons.map(lesson => {
        if (lesson.id === lessonId) {
          return { ...lesson, completed: !lesson.completed };
        }
        return lesson;
      });
      const isCompleted = updatedLessons.length > 0 && updatedLessons.every(l => l.completed);
      return {
        ...mod,
        lessons: updatedLessons,
        completed: isCompleted,
      };
    }),
  }));

  // Recount completed lessons accurately across all modules
  path.stages.forEach(stage =>
    stage.modules.forEach(mod => {
      mod.lessons.forEach(lesson => {
        if (lesson.completed) completedCount++;
      });
    })
  );

  path.completedLessons = completedCount;
  path.status =
    completedCount === 0
      ? 'not-started'
      : completedCount === path.totalLessons
      ? 'completed'
      : 'in-progress';
  path.updatedAt = new Date().toISOString();

  const updatedPaths = paths.map(p => (p.id === pathId ? path : p));
  saveLearningPaths(updatedPaths, userEmail);

  // Update user stats accurately from actual recorded completions
  const user = getUser();
  if (user) {
    const totalDone = updatedPaths.reduce((acc, p) => acc + p.completedLessons, 0);
    user.lessonsCompleted = totalDone;

    // Calculate actual study hours from completed lesson durations
    let totalMinutes = 0;
    updatedPaths.forEach(p => {
      p.stages.forEach(s => {
        s.modules.forEach(m => {
          m.lessons.forEach(l => {
            if (l.completed) {
              totalMinutes += parseDurationToMinutes(l.duration);
            }
          });
        });
      });
    });

    user.totalHoursLearned = Math.round((totalMinutes / 60) * 10) / 10;
    user.learningStreak = totalDone > 0 ? (user.learningStreak > 0 ? user.learningStreak : 1) : 0;
    saveUser(user);
  }

  return path;
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export function getTheme(): 'light' | 'dark' {
  const user = getUser();
  return user?.theme ?? 'light';
}

export function setTheme(theme: 'light' | 'dark'): void {
  const user = getUser();
  if (user) {
    user.theme = theme;
    saveUser(user);
  }
}

// ─── Reset Demo Data ──────────────────────────────────────────────────────────
export function resetDemoData(userEmail?: string): void {
  const key = getPathsStorageKey(userEmail);
  localStorage.removeItem(key);
  const user = getUser();
  if (user) {
    user.learningStreak = 0;
    user.totalHoursLearned = 0;
    user.lessonsCompleted = 0;
    saveUser(user);
  }
}

