import type { AnalyticsData } from '../types';

export const DEMO_ANALYTICS: AnalyticsData = {
  weeklyActivity: [
    { day: 'Mon', hours: 0, lessons: 0 },
    { day: 'Tue', hours: 0, lessons: 0 },
    { day: 'Wed', hours: 0, lessons: 0 },
    { day: 'Thu', hours: 0, lessons: 0 },
    { day: 'Fri', hours: 0, lessons: 0 },
    { day: 'Sat', hours: 0, lessons: 0 },
    { day: 'Sun', hours: 0, lessons: 0 },
  ],
  totalHours: 0,
  completedLessons: 0,
  currentStreak: 0,
  longestStreak: 0,
  achievements: [
    {
      id: 'first-lesson',
      title: 'First Step',
      description: 'Completed your first lesson',
      icon: '🎯',
      earned: false,
    },
    {
      id: 'week-streak',
      title: 'Week Warrior',
      description: 'Maintained a 7-day learning streak',
      icon: '🔥',
      earned: false,
    },
    {
      id: 'ten-lessons',
      title: 'Quick Learner',
      description: 'Completed 10 lessons',
      icon: '⚡',
      earned: false,
    },
    {
      id: 'first-stage',
      title: 'Stage Cleared',
      description: 'Completed your first learning stage',
      icon: '🏆',
      earned: false,
    },
    {
      id: 'month-streak',
      title: 'Month Master',
      description: 'Maintain a 30-day learning streak',
      icon: '👑',
      earned: false,
    },
    {
      id: 'fifty-lessons',
      title: 'Half Century',
      description: 'Complete 50 lessons',
      icon: '💯',
      earned: false,
    },
    {
      id: 'first-path',
      title: 'Pathfinder',
      description: 'Generated your first learning path',
      icon: '🗺️',
      earned: false,
    },
    {
      id: 'hundred-hours',
      title: 'Century Club',
      description: 'Log 100 hours of learning',
      icon: '💪',
      earned: false,
    },
  ],
  moduleCompletion: [],
};

export const HOURS_CHART_DATA = [
  { month: 'Sep', hours: 12.5 },
  { month: 'Oct', hours: 18.0 },
  { month: 'Nov', hours: 10.5 },
  { month: 'Dec', hours: 6.5 },
];
