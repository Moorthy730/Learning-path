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

// ─── User ─────────────────────────────────────────────────────────────────────
export function getUser(): UserProfile | null {
  return safeGet<UserProfile>(KEYS.USER);
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
    learningStreak: 6,
    totalHoursLearned: 47.5,
    lessonsCompleted: 34,
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

// ─── Learning Paths ───────────────────────────────────────────────────────────
export function getLearningPaths(): LearningPath[] {
  return safeGet<LearningPath[]>(KEYS.PATHS) ?? [];
}

export function saveLearningPaths(paths: LearningPath[]): void {
  safeSet(KEYS.PATHS, paths);
}

export function addLearningPath(path: LearningPath): void {
  const paths = getLearningPaths();
  paths.unshift(path);
  saveLearningPaths(paths);
}

export function updateLearningPath(updated: LearningPath): void {
  const paths = getLearningPaths().map(p => (p.id === updated.id ? updated : p));
  saveLearningPaths(paths);
}

export function deleteLearningPath(id: string): void {
  const paths = getLearningPaths().filter(p => p.id !== id);
  saveLearningPaths(paths);
}

export function getLearningPathById(id: string): LearningPath | null {
  return getLearningPaths().find(p => p.id === id) ?? null;
}

// ─── Lesson Completion ─────────────────────────────────────────────────────────
export function toggleLessonCompletion(pathId: string, lessonId: string): LearningPath | null {
  const paths = getLearningPaths();
  const path = paths.find(p => p.id === pathId);
  if (!path) return null;

  let completedCount = 0;
  path.stages = path.stages.map(stage => ({
    ...stage,
    modules: stage.modules.map(mod => ({
      ...mod,
      lessons: mod.lessons.map(lesson => {
        if (lesson.id === lessonId) {
          return { ...lesson, completed: !lesson.completed };
        }
        return lesson;
      }),
    })),
  }));

  // Recount completed lessons
  path.stages.forEach(stage =>
    stage.modules.forEach(mod =>
      mod.lessons.forEach(lesson => {
        if (lesson.completed) completedCount++;
      })
    )
  );

  path.completedLessons = completedCount;
  path.status =
    completedCount === 0
      ? 'not-started'
      : completedCount === path.totalLessons
      ? 'completed'
      : 'in-progress';
  path.updatedAt = new Date().toISOString();

  saveLearningPaths(paths.map(p => (p.id === pathId ? path : p)));

  // Update user stats
  const user = getUser();
  if (user) {
    user.lessonsCompleted = paths.reduce((acc, p) => acc + p.completedLessons, 0);
    user.totalHoursLearned = Math.round(user.lessonsCompleted * 1.2 * 10) / 10;
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
export function resetDemoData(): void {
  localStorage.removeItem(KEYS.PATHS);
  const user = getUser();
  if (user) {
    user.learningStreak = 0;
    user.totalHoursLearned = 0;
    user.lessonsCompleted = 0;
    saveUser(user);
  }
}
