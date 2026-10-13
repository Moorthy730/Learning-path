import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, BookOpen, Clock, Flame, TrendingUp,
  ArrowRight, Plus, Target
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import ProgressBar from '../components/ui/ProgressBar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import DailyTaskChecklist from '../components/notifications/DailyTaskChecklist';

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const MILESTONES = [
  { title: 'Complete React Basics module', due: '2 days', path: 'Full Stack Developer' },
  { title: 'Submit Stage 1 portfolio project', due: '5 days', path: 'Full Stack Developer' },
  { title: 'Start Data Analyst exploration path', due: '1 week', path: 'Data Analyst' },
];

export default function Dashboard() {
  const { user, paths } = useApp();
  const navigate = useNavigate();

  const totalLessons = paths.reduce((a, p) => a + p.totalLessons, 0);
  const completedLessons = paths.reduce((a, p) => a + p.completedLessons, 0);
  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const inProgressPaths = paths.filter(p => p.status === 'in-progress');
  const activePath = inProgressPaths[0] ?? paths[0];

  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500', violet: 'bg-violet-500', blue: 'bg-blue-500',
    green: 'bg-green-500', pink: 'bg-pink-500', red: 'bg-red-500',
    sky: 'bg-sky-500', orange: 'bg-orange-500',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name?.split(' ')[0] ?? 'Learner'} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {paths.length === 0
              ? 'Generate your first learning path to get started.'
              : `You have ${paths.length} learning path${paths.length !== 1 ? 's' : ''}. Keep it up!`}
          </p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => navigate('/onboarding')} id="dashboard-generate-btn">
          Generate New Path
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Learning Paths" value={paths.length} sub="Total created" icon={BookOpen} color="bg-indigo-500" />
        <StatCard label="Lessons Completed" value={completedLessons || user?.lessonsCompleted || 0} sub={`of ${totalLessons || 80} total`} icon={Target} color="bg-violet-500" />
        <StatCard label="Learning Hours" value={`${user?.totalHoursLearned?.toFixed(1) ?? '0'}`} sub="Total tracked" icon={Clock} color="bg-blue-500" />
        <StatCard label="Day Streak" value={`🔥 ${user?.learningStreak ?? 0}`} sub="Current streak" icon={Flame} color="bg-orange-500" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Continue Learning */}
          {activePath ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-white">Continue Learning</h2>
                <Link to={`/paths/${activePath.id}`} className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">View Roadmap →</Link>
              </div>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl ${colorMap[activePath.color] ?? 'bg-indigo-500'} flex items-center justify-center text-2xl flex-shrink-0`}>
                  {activePath.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{activePath.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <span>{activePath.completedLessons} / {activePath.totalLessons} lessons</span>
                    <span>·</span>
                    <span>{activePath.estimatedDuration}</span>
                  </div>
                  <ProgressBar value={activePath.completedLessons} max={activePath.totalLessons} showLabel animated />
                </div>
              </div>
              <div className="mt-4">
                <Button size="sm" onClick={() => navigate(`/paths/${activePath.id}`)} rightIcon={<ArrowRight className="w-4 h-4" />} id="continue-learning-btn">
                  Continue Learning
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 p-6 text-center">
              <Sparkles className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">No active paths yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Generate your first personalized learning roadmap to get started.</p>
              <Button onClick={() => navigate('/onboarding')} leftIcon={<Sparkles className="w-4 h-4" />} id="dashboard-empty-cta">
                Generate My First Path
              </Button>
            </div>
          )}

          {/* Recent Paths */}
          {paths.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-white">Recent Learning Paths</h2>
                <Link to="/paths" className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">View All →</Link>
              </div>
              <div className="space-y-3">
                {paths.slice(0, 3).map(path => (
                  <div key={path.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group" onClick={() => navigate(`/paths/${path.id}`)}>
                    <div className={`w-10 h-10 rounded-xl ${colorMap[path.color] ?? 'bg-indigo-500'} flex items-center justify-center text-xl flex-shrink-0`}>
                      {path.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{path.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <ProgressBar value={path.completedLessons} max={path.totalLessons} size="sm" animated={false} />
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {path.totalLessons > 0 ? Math.round((path.completedLessons / path.totalLessons) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                    <Badge color={path.status === 'completed' ? 'emerald' : path.status === 'in-progress' ? 'indigo' : 'gray'}>
                      {path.status.replace('-', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Daily Task Checklist */}
          <DailyTaskChecklist />
          {/* Overall Progress */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Overall Progress</h2>
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" className="text-gray-100 dark:text-gray-700" strokeWidth="10" />
                  <circle
                    cx="50" cy="50" r="40" fill="none" stroke="url(#grad)" strokeWidth="10"
                    strokeDasharray={`${overallProgress * 2.51} 251`}
                    strokeLinecap="round" className="transition-all duration-700"
                  />
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{overallProgress}%</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">complete</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">{completedLessons || user?.lessonsCompleted || 0} lessons done</span>
            </div>
          </div>

          {/* Upcoming Milestones */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Upcoming Milestones</h2>
            <div className="space-y-3">
              {MILESTONES.map((m, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{m.title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Due in {m.due}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white">
            <h2 className="font-semibold mb-2">Ready for more?</h2>
            <p className="text-indigo-200 text-sm mb-4">Explore new career paths or generate another roadmap.</p>
            <div className="space-y-2">
              <Button variant="outline" size="sm" fullWidth onClick={() => navigate('/onboarding')} className="border-white/30 text-white hover:bg-white/10" id="quick-generate-btn">
                <Sparkles className="w-4 h-4" /> Generate New Path
              </Button>
              <Button variant="ghost" size="sm" fullWidth onClick={() => navigate('/careers')} className="text-white hover:bg-white/10" id="quick-explore-btn">
                <BookOpen className="w-4 h-4 mr-2" /> Explore Careers
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
