/**
 * notificationService.ts — Typed wrappers for notification/reminder/daily-task endpoints.
 */
import { api } from './apiClient';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  type: 'reminder' | 'achievement' | 'system' | 'task_due';
  title: string;
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  notifications: AppNotification[];
  unread_count: number;
}

export interface ReminderPreferences {
  user_id: string;
  enabled: boolean;
  reminder_time: string;      // "HH:MM"
  timezone: string;
  email_enabled: boolean;
  push_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailyTask {
  id: string;
  user_id: string;
  path_id: string;
  lesson_id: string | null;
  task_type: 'lesson' | 'project' | 'assessment' | 'review';
  title: string;
  scheduled_date: string;
  completed: boolean;
  completed_at: string | null;
  overdue: boolean;
  snoozed_until: string | null;
  created_at: string;
}

export interface DailyTaskList {
  today: DailyTask[];
  pending: DailyTask[];
  overdue: DailyTask[];
  completed_today: DailyTask[];
}

// ── Notifications ─────────────────────────────────────────────────────────────

export const notificationApi = {
  list(): Promise<NotificationListResponse> {
    return api.get<NotificationListResponse>('/api/notifications');
  },
  unreadCount(): Promise<{ unread_count: number }> {
    return api.get<{ unread_count: number }>('/api/notifications/unread-count');
  },
  markRead(ids: string[]): Promise<{ updated: number }> {
    return api.patch<{ updated: number }>('/api/notifications/read', { notification_ids: ids });
  },
  markAllRead(): Promise<{ updated: string }> {
    return api.patch<{ updated: string }>('/api/notifications/read-all', {});
  },
};

// ── Reminder Preferences ──────────────────────────────────────────────────────

export const reminderApi = {
  getPreferences(): Promise<ReminderPreferences> {
    return api.get<ReminderPreferences>('/api/reminders/preferences');
  },
  updatePreferences(updates: Partial<Omit<ReminderPreferences, 'user_id' | 'created_at' | 'updated_at'>>): Promise<ReminderPreferences> {
    return api.patch<ReminderPreferences>('/api/reminders/preferences', updates);
  },
};

// ── Daily Tasks ───────────────────────────────────────────────────────────────

export const dailyTaskApi = {
  list(targetDate?: string): Promise<DailyTaskList> {
    const query = targetDate ? `?target_date=${targetDate}` : '';
    return api.get<DailyTaskList>(`/api/daily-tasks${query}`);
  },
  complete(taskId: string, completed: boolean): Promise<DailyTask> {
    return api.patch<DailyTask>(`/api/daily-tasks/${taskId}`, { completed });
  },
  snooze(taskId: string, until: string): Promise<DailyTask> {
    return api.patch<DailyTask>(`/api/daily-tasks/${taskId}`, { snoozed_until: until });
  },
};
