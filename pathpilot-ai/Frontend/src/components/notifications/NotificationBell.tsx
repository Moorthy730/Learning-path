import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Bell, CheckCheck, BellOff, ExternalLink, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { notificationApi } from '../../services/notificationService';
import type { AppNotification } from '../../services/notificationService';
import { useApp } from '../../context/AppContext';

const POLL_MS = 60_000; // poll every 60s

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_ICON: Record<string, string> = {
  reminder: '📍',
  achievement: '🏆',
  system: '🔔',
  task_due: '⏰',
};

export default function NotificationBell() {
  const { user } = useApp();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const isDemo = user?.isDemo;

  const fetchNotifications = useCallback(async () => {
    if (isDemo) return;
    try {
      const res = await notificationApi.list();
      setNotifications(res.notifications);
      setUnreadCount(res.unread_count);
    } catch {
      // Silently fail — bell should never crash the app
    }
  }, [isDemo]);

  // Poll for unread count (lightweight endpoint) when panel is closed
  const pollUnread = useCallback(async () => {
    if (isDemo || open) return;
    try {
      const res = await notificationApi.unreadCount();
      setUnreadCount(res.unread_count);
    } catch {
      // Silently fail
    }
  }, [isDemo, open]);

  useEffect(() => {
    pollUnread();
    const interval = setInterval(pollUnread, POLL_MS);
    return () => clearInterval(interval);
  }, [pollUnread]);

  // Fetch full list when panel opens
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleMarkAllRead = async () => {
    if (isDemo) return;
    try {
      await notificationApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  const handleMarkRead = async (id: string) => {
    if (isDemo) return;
    try {
      await notificationApi.markRead([id]);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        id="notification-bell-btn"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen(v => !v)}
        className="p-2 rounded-lg hover:bg-[#FFF0EE] dark:hover:bg-[#2a1410] text-[#8B5447] dark:text-[#F6C77B]/60 transition-colors relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-[#D85C4A] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse"
            aria-hidden="true"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications panel"
          className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-1rem)] bg-white dark:bg-[#2a1410] rounded-2xl border border-[#F6C77B]/30 dark:border-[#5c2e20]/50 shadow-2xl shadow-[#D85C4A]/10 z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#F6C77B]/25 dark:border-[#5c2e20]/40">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#D85C4A]" />
              <span className="font-semibold text-sm text-[#542E28] dark:text-[#F9E3B5]">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-[#D85C4A]/15 text-[#D85C4A] dark:text-[#F6C77B] text-xs font-semibold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                id="mark-all-read-btn"
                onClick={handleMarkAllRead}
                className="text-xs text-[#D85C4A] dark:text-[#F3A65A] hover:underline flex items-center gap-1 font-medium"
              >
                <CheckCheck className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {isDemo ? (
              <div className="px-4 py-8 text-center">
                <BellOff className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-[#8B5447] dark:text-[#F6C77B]/60">
                  Notifications are available after sign-in.
                </p>
                <Link to="/signin" className="text-xs text-[#D85C4A] dark:text-[#F3A65A] hover:underline mt-1 block">
                  Sign in →
                </Link>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-[#8B5447] dark:text-[#F6C77B]/60">You're all caught up!</p>
                <p className="text-xs text-[#8B5447]/60 dark:text-[#F6C77B]/40 mt-1">
                  Daily reminders will appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[#F6C77B]/20 dark:divide-[#5c2e20]/30">
                {notifications.map(n => (
                  <li
                    key={n.id}
                    onClick={() => !n.read && handleMarkRead(n.id)}
                    className={`px-4 py-3 hover:bg-[#FFF8F0] dark:hover:bg-[#3a1c14]/50 transition-colors cursor-pointer ${
                      !n.read ? 'bg-[#F9E3B5]/40 dark:bg-[#D85C4A]/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? '🔔'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium leading-tight ${
                            !n.read
                              ? 'text-[#542E28] dark:text-[#F9E3B5]'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {n.title}
                          </p>
                          {!n.read && (
                            <span className="w-2 h-2 bg-[#D85C4A] rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-[#8B5447] dark:text-[#F6C77B]/60 mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 text-[#8B5447]/60" />
                          <span className="text-[10px] text-[#8B5447]/60 dark:text-[#F6C77B]/40">
                            {timeAgo(n.created_at)}
                          </span>
                          {(() => {
                            const pathId = n.data?.path_id ? String(n.data.path_id) : null;
                            return pathId ? (
                              <Link
                                to={`/paths/${pathId}`}
                                onClick={e => { e.stopPropagation(); setOpen(false); }}
                                className="ml-auto text-[10px] text-[#D85C4A] dark:text-[#F3A65A] hover:underline flex items-center gap-0.5"
                              >
                                Open <ExternalLink className="w-2.5 h-2.5" />
                              </Link>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-[#F6C77B]/25 dark:border-[#5c2e20]/40 bg-[#FFFAF5] dark:bg-[#2a1410]/80">
            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className="text-xs text-[#D85C4A] dark:text-[#F3A65A] hover:underline"
              id="notification-settings-link"
            >
              Manage reminder settings →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
