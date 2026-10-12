import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronDown, ChevronRight, CheckCircle, Circle,
  Clock, ExternalLink, BookOpen, Code, Target, Award, Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import type { Lesson, Module, Stage } from '../types';

const colorMap: Record<string, string> = {
  indigo: 'from-indigo-500 to-indigo-600',
  violet: 'from-violet-500 to-violet-600',
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  pink: 'from-pink-500 to-pink-600',
  red: 'from-red-500 to-red-600',
  sky: 'from-sky-500 to-sky-600',
  orange: 'from-orange-500 to-orange-600',
};

const lessonTypeIcon = { lesson: BookOpen, project: Code, checkpoint: Target };
const lessonTypeBadgeColor: Record<string, 'indigo' | 'violet' | 'amber'> = {
  lesson: 'indigo', project: 'violet', checkpoint: 'amber'
};

function LessonItem({
  lesson, onToggle
}: {
  lesson: Lesson; onToggle: (lessonId: string) => void;
}) {
  const LessonIcon = lessonTypeIcon[lesson.type] ?? BookOpen;
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${lesson.completed ? 'bg-emerald-50 dark:bg-emerald-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
      <button
        onClick={() => onToggle(lesson.id)}
        className={`mt-0.5 flex-shrink-0 transition-colors ${lesson.completed ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-600 hover:text-indigo-500'}`}
        aria-label={lesson.completed ? 'Mark as incomplete' : 'Mark as complete'}
        id={`lesson-check-${lesson.id}`}
      >
        {lesson.completed ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <p className={`text-sm font-medium ${lesson.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-gray-200'}`}>
            {lesson.title}
          </p>
          <Badge color={lessonTypeBadgeColor[lesson.type]}>{lesson.type}</Badge>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{lesson.description}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            <Clock className="w-3 h-3" /> {lesson.duration}
          </span>
          {lesson.resources.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {lesson.resources.map(r => (
                <a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" /> {r.title}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ModuleAccordion({ module, stageNum, onToggle }: { module: Module; stageNum: number; onToggle: (lessonId: string) => void }) {
  const [open, setOpen] = useState(stageNum === 1);
  const completed = module.lessons.filter(l => l.completed).length;
  const total = module.lessons.length;

  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
        id={`module-toggle-${module.id}`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{module.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{module.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          <span className="text-xs text-gray-500 dark:text-gray-400">{completed}/{total}</span>
          {completed === total && total > 0 && <Award className="w-4 h-4 text-emerald-500" />}
          {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </div>
      </button>
      {open && (
        <div className="border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800/50">
          {module.lessons.map(lesson => (
            <LessonItem key={lesson.id} lesson={lesson} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  );
}

function StageSection({ stage, onToggle }: { stage: Stage; onToggle: (lessonId: string) => void }) {
  const totalLessons = stage.modules.reduce((a, m) => a + m.lessons.length, 0);
  const completed = stage.modules.reduce((a, m) => a + m.lessons.filter(l => l.completed).length, 0);
  const pct = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {stage.number}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{stage.title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{stage.description} · ~{stage.estimatedWeeks} week{stage.estimatedWeeks !== 1 ? 's' : ''}</p>
        </div>
        <div className="text-right">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{pct}%</span>
          <p className="text-xs text-gray-400 dark:text-gray-500">{completed}/{totalLessons}</p>
        </div>
      </div>
      <div className="ml-14 space-y-2">
        {stage.modules.map(mod => (
          <ModuleAccordion key={mod.id} module={mod} stageNum={stage.number} onToggle={onToggle} />
        ))}
      </div>
    </div>
  );
}

export default function RoadmapDetails() {
  const { id } = useParams<{ id: string }>();
  const { paths, toggleLesson, addToast } = useApp();
  const navigate = useNavigate();

  const path = paths.find(p => p.id === id);

  if (!path) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center gap-4">
        <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600" />
        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300">Path not found</h2>
        <Button onClick={() => navigate('/paths')}>Back to My Paths</Button>
      </div>
    );
  }

  const pct = path.totalLessons > 0 ? Math.round((path.completedLessons / path.totalLessons) * 100) : 0;

  const handleToggle = (lessonId: string) => {
    const prev = path.stages.flatMap(s => s.modules.flatMap(m => m.lessons)).find(l => l.id === lessonId);
    toggleLesson(path.id, lessonId);
    addToast({
      type: prev?.completed ? 'info' : 'success',
      title: prev?.completed ? 'Lesson marked incomplete' : 'Lesson completed! 🎉',
    });
  };

  const gradientClass = colorMap[path.color] ?? 'from-indigo-500 to-indigo-600';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <button onClick={() => navigate('/paths')} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to My Paths
      </button>

      {/* Header card */}
      <div className={`bg-gradient-to-br ${gradientClass} rounded-2xl p-6 text-white`}>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl flex-shrink-0">
            {path.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge color="indigo" variant="solid">{path.skillLevel}</Badge>
              <span className="text-white/70 text-xs font-medium bg-white/10 px-2 py-0.5 rounded-full">Interactive Demo</span>
            </div>
            <h1 className="text-xl font-bold">{path.title}</h1>
            <p className="text-white/80 text-sm mt-1 leading-relaxed">{path.description}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{pct}%</p>
            <p className="text-white/70 text-xs">Complete</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{path.estimatedDuration}</p>
            <p className="text-white/70 text-xs">Estimated</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{path.stages.length}</p>
            <p className="text-white/70 text-xs">Stages</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-white/80 mb-1.5">
            <span>{path.completedLessons} of {path.totalLessons} lessons</span>
            <span>{pct}%</span>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Required skills */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Skills You'll Gain</h2>
        <div className="flex flex-wrap gap-2">
          {path.requiredSkills.map(skill => (
            <Badge key={skill} color="indigo">{skill}</Badge>
          ))}
        </div>
      </div>

      {/* Stages */}
      <div className="space-y-8">
        {path.stages.map(stage => (
          <StageSection key={stage.id} stage={stage} onToggle={handleToggle} />
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pb-8">
        <Button
          leftIcon={<Sparkles className="w-4 h-4" />}
          onClick={() => navigate('/onboarding')}
          variant="outline"
          id="regenerate-path-btn"
        >
          Generate New Path
        </Button>
        {pct === 100 && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-sm font-medium">
            <Award className="w-5 h-5" /> 🎉 Congratulations! You've completed this roadmap!
          </div>
        )}
      </div>
    </div>
  );
}
