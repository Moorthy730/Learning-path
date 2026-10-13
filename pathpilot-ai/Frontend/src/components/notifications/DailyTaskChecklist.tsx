import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2, Circle, AlertTriangle, Clock,
  ChevronRight, RefreshCw, CalendarCheck
} from 'lucide-react';
import { dailyTaskApi } from '../../services/notificationService';
import type { DailyTask, DailyTaskList } from '../../services/notificationService';
import { useApp } from '../../context/AppContext';
import Badge from '../ui/Badge';

function TaskRow({
  task,
  onToggle,
}: {
  task: DailyTask;
  onToggle: (id: string, done: boolean) => void;
}) {
  const typeColor = {
    lesson: 'indigo',
    project: 'violet',
    assessment: 'amber',
    review: 'blue',
  } as const;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
      task.completed
        ? 'opacity-60 bg-gray-50 dark:bg-[#2a1410]/30'
        : task.overdue
        ? 'bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30'
        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
    }`}>
      <button
        id={`task-toggle-${task.id}`}
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
        onClick={() => onToggle(task.id, !task.completed)}
        className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110"
      >
        {task.completed ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        ) : (
          <Circle className="w-5 h-5 text-[#F6C77B] dark:text-[#5c2e20] hover:text-[#D85C4A]" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-tight ${
          task.completed
            ? 'line-through text-gray-400 dark:text-gray-500'
            : 'text-gray-800 dark:text-gray-200'
        }`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Badge
            color={typeColor[task.task_type] || 'gray'}
            size="sm"
            variant="soft"
          >
            {task.task_type}
          </Badge>
          {task.overdue && (
            <span className="flex items-center gap-0.5 text-[10px] text-red-500 font-medium">
              <AlertTriangle className="w-3 h-3" />
              Overdue
            </span>
          )}
          {task.completed && task.completed_at && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
              ✓ Done
            </span>
          )}
        </div>
      </div>
      <Link
        to={`/paths/${task.path_id}`}
        className="flex-shrink-0 text-gray-300 dark:text-gray-600 hover:text-[#D85C4A] dark:hover:text-[#E9825C] transition-colors"
        aria-label="Open learning path"
        title="Open learning path"
      >
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

export default function DailyTaskChecklist() {
  const { user } = useApp();
  const [tasks, setTasks] = useState<DailyTaskList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDemo = user?.isDemo;

  const load = useCallback(async () => {
    if (isDemo) return;
    setLoading(true);
    setError(null);
    try {
      const data = await dailyTaskApi.list();
      setTasks(data);
    } catch {
      setError("Couldn't load today's tasks");
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (taskId: string, completed: boolean) => {
    if (isDemo) return;
    // Optimistic update
    setTasks(prev => {
      if (!prev) return prev;
      const update = (arr: DailyTask[]) =>
        arr.map(t => t.id === taskId ? { ...t, completed, overdue: completed ? false : t.overdue } : t);
      return {
        ...prev,
        today: update(prev.today),
        overdue: update(prev.overdue),
        completed_today: update(prev.completed_today),
      };
    });
    try {
      await dailyTaskApi.complete(taskId, completed);
    } catch {
      load(); // revert on failure
    }
  };

  const allTasks = tasks
    ? [...(tasks.today ?? []), ...(tasks.overdue ?? []), ...(tasks.completed_today ?? [])]
    : [];
  const pending = allTasks.filter(t => !t.completed);
  const completedCount = allTasks.filter(t => t.completed).length;
  const progress = allTasks.length > 0
    ? Math.round((completedCount / allTasks.length) * 100)
    : 0;

  if (isDemo) {
    return (
      <div className="bg-white dark:bg-[#1c0f0d] rounded-2xl border border-[#F6C77B]/25 dark:border-[#5c2e20]/40 p-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarCheck className="w-5 h-5 text-[#D85C4A]" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Today's Tasks</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          Sign in to see your daily learning tasks.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1c0f0d] rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-[#D85C4A]" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Today's Tasks</h2>
          {allTasks.length > 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {completedCount}/{allTasks.length}
            </span>
          )}
        </div>
        <button
          id="refresh-tasks-btn"
          onClick={load}
          disabled={loading}
          aria-label="Refresh tasks"
          className="p-1.5 rounded-lg text-gray-400 hover:text-[#D85C4A] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Progress bar */}
      {allTasks.length > 0 && (
        <div className="mb-4">
          <div className="h-1.5 bg-[#F9E3B5] dark:bg-[#3a1c14] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#D85C4A] to-[#F3A65A] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>{progress}% complete</span>
            {progress === 100 && <span className="text-emerald-500">🎉 All done!</span>}
          </div>
        </div>
      )}

      {error ? (
        <p className="text-sm text-red-500 text-center py-4">{error}</p>
      ) : loading && !tasks ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-[#2a1410] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : allTasks.length === 0 ? (
        <div className="text-center py-6">
          <Clock className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No tasks scheduled today.</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Tasks are auto-created from your learning paths.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Overdue first */}
          {(tasks?.overdue?.length ?? 0) > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wider mb-1.5 px-1">
                ⚠ Overdue
              </p>
              {tasks!.overdue.map(t => (
                <TaskRow key={t.id} task={t} onToggle={handleToggle} />
              ))}
            </div>
          )}
          {/* Today's pending */}
          {(tasks?.today?.length ?? 0) > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-semibold text-[#D85C4A] dark:text-[#F3A65A] uppercase tracking-wider mb-1.5 px-1">
                Today
              </p>
              {tasks!.today.map(t => (
                <TaskRow key={t.id} task={t} onToggle={handleToggle} />
              ))}
            </div>
          )}
          {/* Completed today */}
          {(tasks?.completed_today?.length ?? 0) > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-1.5 px-1">
                Completed Today
              </p>
              {tasks!.completed_today.map(t => (
                <TaskRow key={t.id} task={t} onToggle={handleToggle} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
