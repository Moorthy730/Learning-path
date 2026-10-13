/**
 * backendService.ts — Typed wrappers for every PathPilot AI backend endpoint.
 *
 * When VITE_API_URL is set and the user has a real Supabase session,
 * all calls go to the FastAPI backend.
 *
 * When running in demo mode (no env vars / no session), each function
 * falls through to the original localStorage-based mock — preserving
 * the full demo experience without requiring a backend.
 */

import { api, ApiError } from './apiClient';
import { supabase } from './supabaseClient';
import type { LearningPath, OnboardingData, UserProfile } from '../types';

// ── Backend response types (mirror backend schemas.py) ─────────────────────

export interface BackendLesson {
  id: string;
  module_id: string;
  title: string;
  description: string;
  estimated_hours: number;
  resource_url: string | null;
  completion_criteria: string;
  order_index: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface BackendModule {
  id: string;
  path_id: string;
  title: string;
  description: string;
  order_index: number;
  estimated_hours: number;
  project: string | null;
  lessons: BackendLesson[];
  created_at: string;
}

export interface BackendLearningPath {
  id: string;
  user_id: string;
  title: string;
  goal: string;
  current_level: string;
  existing_skills: string[];
  daily_hours: number;
  duration_weeks: number;
  learning_format: string;
  learning_objective: string;
  summary: string;
  status: string;
  modules: BackendModule[];
  created_at: string;
  updated_at: string;
}

export interface BackendPathSummary {
  id: string;
  title: string;
  goal: string;
  current_level: string;
  status: string;
  duration_weeks: number;
  total_lessons: number;
  completed_lessons: number;
  completion_pct: number;
  created_at: string;
  updated_at: string;
}

export interface BackendProgress {
  path_id: string;
  total_modules: number;
  total_lessons: number;
  completed_lessons: number;
  remaining_lessons: number;
  completion_pct: number;
  completed_hours: number;
  remaining_hours: number;
}

export interface BackendProfile {
  id: string;
  display_name: string | null;
  email: string | null;
  created_at: string;
}

export interface AssessmentForClient {
  assessment_id: string;
  module_id: string;
  questions: { id: string; question: string; options: string[] }[];
}

export interface AssessmentResult {
  id: string;
  score: number;
  total_questions: number;
  percentage: number;
  passed: boolean;
  created_at: string;
}

// ── Session check ──────────────────────────────────────────────────────────

async function hasRealSession(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session?.access_token;
  } catch {
    return false;
  }
}

// ── Converter: BackendLearningPath → frontend LearningPath ─────────────────

export function backendPathToFrontend(bp: BackendLearningPath): LearningPath {
  // Convert backend flat module/lesson structure into the frontend Stage/Module/Lesson tree
  const stages = bp.modules.map((mod, idx) => ({
    id: mod.id,
    number: idx + 1,
    title: mod.title,
    description: mod.description,
    estimatedWeeks: Math.ceil(mod.estimated_hours / (bp.daily_hours * 7)),
    modules: [
      {
        id: mod.id,
        title: mod.title,
        description: mod.description,
        completed: mod.lessons.every((l) => l.completed),
        expanded: false,
        lessons: mod.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          description: l.description,
          duration: `${l.estimated_hours}h`,
          completed: l.completed,
          type: 'lesson' as const,
          resources: l.resource_url
            ? [
                {
                  id: l.id,
                  title: 'Resource',
                  type: 'article' as const,
                  url: l.resource_url,
                },
              ]
            : [],
        })),
      },
    ],
  }));

  const totalLessons = bp.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedLessons = bp.modules.reduce(
    (acc, m) => acc + m.lessons.filter((l) => l.completed).length,
    0,
  );

  return {
    id: bp.id,
    title: bp.title,
    careerGoal: bp.goal,
    skillLevel: bp.current_level as LearningPath['skillLevel'],
    status: bp.status as LearningPath['status'],
    description: bp.summary,
    stages,
    requiredSkills: bp.existing_skills,
    estimatedDuration: `${bp.duration_weeks} weeks`,
    totalLessons,
    completedLessons,
    hoursPerDay: bp.daily_hours,
    targetWeeks: bp.duration_weeks,
    learningFormat: bp.learning_format as LearningPath['learningFormat'],
    learningObjective: bp.learning_objective as LearningPath['learningObjective'],
    createdAt: bp.created_at,
    updatedAt: bp.updated_at,
    icon: '🎯',
    color: 'indigo',
  };
}

// ── Auth ────────────────────────────────────────────────────────────────────

export const authService = {
  async signUp(email: string, password: string, displayName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async signOut() {
    await supabase.auth.signOut();
  },

  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  onAuthStateChange(callback: (session: unknown) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
  },
};

// ── Learning Paths ─────────────────────────────────────────────────────────

export const pathsService = {
  async generate(onboarding: OnboardingData): Promise<BackendLearningPath> {
    const durationWeeks =
      onboarding.targetDurationUnit === 'months'
        ? onboarding.targetDuration * 4
        : onboarding.targetDuration;

    const payload = {
      career_goal: onboarding.customGoal || onboarding.careerGoal,
      skill_level: onboarding.skillLevel,
      existing_skills: onboarding.existingSkills,
      daily_hours: onboarding.hoursPerDay,
      duration_weeks: durationWeeks,
      learning_format: onboarding.learningFormat,
      learning_objective: onboarding.learningObjective,
    };

    return api.post<BackendLearningPath>('/api/learning-paths/generate', payload);
  },

  async list(): Promise<BackendPathSummary[]> {
    return api.get<BackendPathSummary[]>('/api/learning-paths');
  },

  async get(pathId: string): Promise<BackendLearningPath> {
    return api.get<BackendLearningPath>(`/api/learning-paths/${pathId}`);
  },

  async update(pathId: string, updates: { title?: string; status?: string }): Promise<BackendLearningPath> {
    return api.patch<BackendLearningPath>(`/api/learning-paths/${pathId}`, updates);
  },

  async delete(pathId: string): Promise<void> {
    return api.delete(`/api/learning-paths/${pathId}`);
  },

  async revise(pathId: string, updates: Record<string, unknown>): Promise<BackendLearningPath> {
    return api.post<BackendLearningPath>(`/api/learning-paths/${pathId}/revise`, updates);
  },

  async getProgress(pathId: string): Promise<BackendProgress> {
    return api.get<BackendProgress>(`/api/learning-paths/${pathId}/progress`);
  },
};

// ── Lessons ────────────────────────────────────────────────────────────────

export const lessonsService = {
  async toggleProgress(lessonId: string, completed: boolean) {
    return api.patch<{ lesson_id: string; completed: boolean; path_progress: BackendProgress }>(
      `/api/lessons/${lessonId}/progress`,
      { completed },
    );
  },
};

// ── Profile ────────────────────────────────────────────────────────────────

export const profileService = {
  async getMe(): Promise<BackendProfile> {
    return api.get<BackendProfile>('/api/profiles/me');
  },

  async updateMe(updates: { display_name?: string }): Promise<BackendProfile> {
    return api.patch<BackendProfile>('/api/profiles/me', updates);
  },
};

// ── Assessments ────────────────────────────────────────────────────────────

export const assessmentService = {
  async generate(pathId: string, moduleId: string): Promise<AssessmentForClient> {
    return api.post<AssessmentForClient>('/api/assessments/generate', {
      path_id: pathId,
      module_id: moduleId,
    });
  },

  async submit(
    assessmentId: string,
    pathId: string,
    moduleId: string,
    answers: Record<string, number>,
  ): Promise<AssessmentResult> {
    return api.post<AssessmentResult>('/api/assessments/submit', {
      assessment_id: assessmentId,
      path_id: pathId,
      module_id: moduleId,
      answers,
    });
  },

  async getHistory(pathId: string): Promise<AssessmentResult[]> {
    return api.get<AssessmentResult[]>(
      `/api/learning-paths/${pathId}/assessments`,
    );
  },
};

// ── Health check ───────────────────────────────────────────────────────────

export const healthService = {
  async check() {
    return api.healthGet<{ status: string }>('/health');
  },
};
