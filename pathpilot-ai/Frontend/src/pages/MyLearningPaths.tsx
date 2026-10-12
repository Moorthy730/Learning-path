import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, Trash2, BookOpen, Clock, ChevronRight,
  LayoutGrid, List, Sparkles, AlertTriangle, X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import ProgressBar from '../components/ui/ProgressBar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import type { LearningPath, SkillLevel, PathStatus } from '../types';

function DeleteModal({ path, onConfirm, onCancel }: { path: LearningPath; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl p-6 max-w-sm w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white">Delete Learning Path</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to delete <strong>"{path.title}"</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={onCancel} id="delete-cancel-btn">Cancel</Button>
          <Button variant="danger" fullWidth onClick={onConfirm} id="delete-confirm-btn">Delete</Button>
        </div>
      </div>
    </div>
  );
}

const colorMap: Record<string, string> = {
  indigo: 'bg-indigo-500', violet: 'bg-violet-500', blue: 'bg-blue-500',
  green: 'bg-green-500', pink: 'bg-pink-500', red: 'bg-red-500',
  sky: 'bg-sky-500', orange: 'bg-orange-500',
};

const statusBadgeColor: Record<PathStatus, 'gray' | 'indigo' | 'emerald' | 'amber'> = {
  'not-started': 'gray',
  'in-progress': 'indigo',
  'completed': 'emerald',
  'paused': 'amber',
};

export default function MyLearningPaths() {
  const { paths, deletePath, addToast } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<SkillLevel | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<PathStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteTarget, setDeleteTarget] = useState<LearningPath | null>(null);

  const filtered = paths.filter(p => {
    const matchQ = p.title.toLowerCase().includes(query.toLowerCase()) || p.careerGoal.toLowerCase().includes(query.toLowerCase());
    const matchL = filterLevel === 'all' || p.skillLevel === filterLevel;
    const matchS = filterStatus === 'all' || p.status === filterStatus;
    return matchQ && matchL && matchS;
  });

  const handleDelete = (path: LearningPath) => setDeleteTarget(path);
  const confirmDelete = () => {
    if (!deleteTarget) return;
    deletePath(deleteTarget.id);
    addToast({ type: 'success', title: 'Path deleted', message: `"${deleteTarget.title}" has been removed.` });
    setDeleteTarget(null);
  };

  const PathCard = ({ path }: { path: LearningPath }) => {
    const pct = path.totalLessons > 0 ? Math.round((path.completedLessons / path.totalLessons) * 100) : 0;
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md transition-all group">
        <div className={`h-2 ${colorMap[path.color] ?? 'bg-indigo-500'}`} />
        <div className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl ${colorMap[path.color] ?? 'bg-indigo-500'} flex items-center justify-center text-xl flex-shrink-0`}>
              {path.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{path.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{path.careerGoal}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <Badge color={statusBadgeColor[path.status]}>{path.status.replace('-', ' ')}</Badge>
            <Badge color="gray">{path.skillLevel}</Badge>
          </div>

          <ProgressBar value={path.completedLessons} max={path.totalLessons} size="sm" label={`${path.completedLessons}/${path.totalLessons} lessons`} showLabel animated />

          <div className="flex items-center gap-2 mt-3 text-xs text-gray-400 dark:text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            <span>{path.estimatedDuration}</span>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button size="sm" onClick={() => navigate(`/paths/${path.id}`)} rightIcon={<ChevronRight className="w-3.5 h-3.5" />} id={`continue-${path.id}`} className="flex-1">
              {pct > 0 ? 'Continue' : 'Start'}
            </Button>
            <button
              onClick={() => handleDelete(path)}
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              aria-label="Delete path"
              id={`delete-${path.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const PathRow = ({ path }: { path: LearningPath }) => {
    const pct = path.totalLessons > 0 ? Math.round((path.completedLessons / path.totalLessons) * 100) : 0;
    return (
      <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-sm transition-all">
        <div className={`w-10 h-10 rounded-xl ${colorMap[path.color] ?? 'bg-indigo-500'} flex items-center justify-center text-xl flex-shrink-0`}>
          {path.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{path.title}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{path.estimatedDuration} · {path.completedLessons}/{path.totalLessons} lessons</p>
        </div>
        <div className="hidden sm:block w-36">
          <ProgressBar value={path.completedLessons} max={path.totalLessons} size="sm" showLabel animated />
        </div>
        <div className="hidden md:block">
          <Badge color={statusBadgeColor[path.status]}>{path.status.replace('-', ' ')}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(`/paths/${path.id}`)} id={`row-continue-${path.id}`}>
            {pct > 0 ? 'Continue' : 'Start'}
          </Button>
          <button onClick={() => handleDelete(path)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" aria-label="Delete" id={`row-delete-${path.id}`}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {deleteTarget && <DeleteModal path={deleteTarget} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Learning Paths</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{paths.length} path{paths.length !== 1 ? 's' : ''} created</p>
        </div>
        <Button leftIcon={<Sparkles className="w-4 h-4" />} onClick={() => navigate('/onboarding')} id="paths-generate-btn">
          Generate New Path
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by career goal..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            id="paths-search"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={filterLevel}
          onChange={e => setFilterLevel(e.target.value as SkillLevel | 'all')}
          className="px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          id="paths-filter-level"
        >
          <option value="all">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as PathStatus | 'all')}
          className="px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          id="paths-filter-status"
        >
          <option value="all">All Status</option>
          <option value="not-started">Not Started</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`} aria-label="Grid view">
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`} aria-label="List view">
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-16 text-center">
          {paths.length === 0 ? (
            <>
              <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">No learning paths yet</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Generate your first personalized learning roadmap to get started.</p>
              <Button onClick={() => navigate('/onboarding')} leftIcon={<Sparkles className="w-4 h-4" />} id="empty-generate-btn">Generate My First Path</Button>
            </>
          ) : (
            <>
              <Filter className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">No paths match your filters</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Try adjusting your search or filters.</p>
              <button onClick={() => { setQuery(''); setFilterLevel('all'); setFilterStatus('all'); }} className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">Clear all filters</button>
            </>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(p => <PathCard key={p.id} path={p} />)}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => <PathRow key={p.id} path={p} />)}
        </div>
      )}
    </div>
  );
}
