import React from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Flame, Trophy, Target, Clock, TrendingUp } from 'lucide-react';
import { DEMO_ANALYTICS, HOURS_CHART_DATA } from '../data/demoAnalytics';
import { useApp } from '../context/AppContext';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';

const COLORS = ['#D85C4A', '#E9825C', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const pieData = [
  { name: 'Completed', value: 34, color: '#D85C4A' },
  { name: 'Remaining', value: 46, color: '#e5e7eb' },
];

function StatCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{className?: string}>; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white dark:bg-[#1c0f0d] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
}

export default function Analytics() {
  const { user, paths } = useApp();
  const analytics = DEMO_ANALYTICS;

  // Compute real values from paths if available
  const totalCompleted = paths.reduce((a, p) => a + p.completedLessons, 0);
  const totalLessons = paths.reduce((a, p) => a + p.totalLessons, 0);
  const realPieData = paths.length > 0
    ? [
        { name: 'Completed', value: totalCompleted || 0, color: '#D85C4A' },
        { name: 'Remaining', value: Math.max(0, totalLessons - totalCompleted), color: '#e5e7eb' },
      ]
    : pieData;

  const modulesData = paths.length > 0
    ? paths.flatMap(p => p.stages?.flatMap(s => s.modules.map(m => ({
        name: m.title,
        completed: m.lessons.filter(l => l.completed).length,
        total: m.lessons.length,
      }))) ?? [])
    : analytics.moduleCompletion;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Progress Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Track your learning activity and milestones.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Clock} label="Total Hours" value={`${user?.totalHoursLearned !== undefined ? user.totalHoursLearned.toFixed(1) : '0.0'}h`} color="bg-[#D85C4A]" />
        <StatCard icon={Target} label="Lessons Done" value={totalCompleted} color="bg-[#E9825C]" />
        <StatCard icon={Flame} label="Current Streak" value={`${totalCompleted > 0 ? (user?.learningStreak ?? 1) : 0} days`} color="bg-orange-500" />
        <StatCard icon={Trophy} label="Longest Streak" value={`${totalCompleted > 0 ? (user?.learningStreak ?? 1) : 0} days`} color="bg-amber-500" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weekly Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1c0f0d] rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-6">Weekly Learning Activity</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics.weeklyActivity} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
                formatter={(val) => [`${val} hrs`, 'Study Hours']}
              />
              <Bar dataKey="hours" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D85C4A" />
                  <stop offset="100%" stopColor="#E9825C" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Lessons pie */}
        <div className="bg-white dark:bg-[#1c0f0d] rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Lesson Progress</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={realPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {realPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(val, name) => [val, name]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {realPieData.map(entry => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
                {entry.name}: <strong>{entry.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hours over time */}
      <div className="bg-white dark:bg-[#1c0f0d] rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-6">Learning Hours Over Time</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={HOURS_CHART_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} formatter={(val) => [`${val}h`, 'Hours']} />
            <Line type="monotone" dataKey="hours" stroke="#D85C4A" strokeWidth={2.5} dot={{ fill: '#D85C4A', r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Module Completion */}
      <div className="bg-white dark:bg-[#1c0f0d] rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-5">Module Completion</h2>
        <div className="space-y-4">
          {modulesData.length > 0 ? (
            modulesData.map((mod, i) => (
              <ProgressBar
                key={`${mod.name}-${i}`}
                value={mod.completed}
                max={mod.total}
                label={`${mod.name} (${mod.completed}/${mod.total})`}
                showLabel
                color={i % 2 === 0 ? 'indigo' : 'violet'}
                animated
              />
            ))
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">No modules yet</p>
          )}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white dark:bg-[#1c0f0d] rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900 dark:text-white">Achievements</h2>
          <Badge color="indigo">{analytics.achievements.filter(a => a.earned).length} / {analytics.achievements.length} earned</Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {analytics.achievements.map(achievement => (
            <div
              key={achievement.id}
              className={`p-4 rounded-xl border text-center transition-all ${
                achievement.earned
                  ? 'border-[#F9E3B5] dark:border-[#D85C4A]/40 bg-[#FFF0EE] dark:bg-[#D85C4A]/15'
                  : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#2a1410] opacity-50'
              }`}
            >
              <div className="text-3xl mb-2">{achievement.icon}</div>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{achievement.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{achievement.description}</p>
              {achievement.earnedAt && (
                <p className="text-xs text-[#D85C4A] dark:text-[#E9825C] mt-1">{new Date(achievement.earnedAt).toLocaleDateString()}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
