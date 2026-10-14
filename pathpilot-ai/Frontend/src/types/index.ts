// Core Types for PathPilot AI

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';
export type LearningFormat = 'video' | 'articles' | 'hands-on' | 'mixed';
export type LearningObjective = 'job-readiness' | 'academic' | 'career-change' | 'personal';
export type PathStatus = 'not-started' | 'in-progress' | 'completed' | 'paused';

export interface Skill {
  id: string;
  name: string;
}

export interface LearningResource {
  id: string;
  title: string;
  type: 'video' | 'article' | 'course' | 'documentation' | 'project';
  url: string;
  duration?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  resources: LearningResource[];
  completed: boolean;
  type: 'lesson' | 'project' | 'checkpoint';
}

export interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  completed: boolean;
  expanded?: boolean;
}

export interface Stage {
  id: string;
  number: number;
  title: string;
  description: string;
  modules: Module[];
  estimatedWeeks: number;
}

export interface LearningPath {
  id: string;
  title: string;
  careerGoal: string;
  skillLevel: SkillLevel;
  status: PathStatus;
  description: string;
  stages: Stage[];
  requiredSkills: string[];
  estimatedDuration: string;
  totalLessons: number;
  completedLessons: number;
  hoursPerDay: number;
  targetWeeks: number;
  learningFormat: LearningFormat;
  learningObjective: LearningObjective;
  createdAt: string;
  updatedAt: string;
  icon: string;
  color: string;
}

export interface OnboardingData {
  careerGoal: string;
  customGoal?: string;
  skillLevel: SkillLevel;
  existingSkills: string[];
  hoursPerDay: number;
  targetDuration: number;
  targetDurationUnit: 'weeks' | 'months';
  learningFormat: LearningFormat;
  learningObjective: LearningObjective;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  learningStreak: number;
  totalHoursLearned: number;
  lessonsCompleted: number;
  preferredFormat: LearningFormat;
  dailyTarget: number;
  theme: 'light' | 'dark';
  /** Legacy storage compatibility; AppContext creates users exclusively from Supabase sessions. */
  isDemo?: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt?: string;
  earned: boolean;
}

export interface WeeklyActivity {
  day: string;
  hours: number;
  lessons: number;
}

export interface AnalyticsData {
  weeklyActivity: WeeklyActivity[];
  totalHours: number;
  completedLessons: number;
  currentStreak: number;
  longestStreak: number;
  achievements: Achievement[];
  moduleCompletion: { name: string; completed: number; total: number }[];
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

export interface CareerOption {
  id: string;
  title: string;
  description: string;
  skills: string[];
  estimatedDuration: string;
  icon: string;
  color: string;
  difficulty: SkillLevel;
}
