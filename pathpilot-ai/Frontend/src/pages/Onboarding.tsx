import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, X, Sparkles,
  Check, Plus, Target, BookOpen, Clock, RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateLearningPath } from '../services/roadmapService';
import type { OnboardingData, SkillLevel, LearningFormat, LearningObjective } from '../types';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import { CAREER_GOALS } from '../data/careers';

const SKILL_LEVELS: { value: SkillLevel; label: string; description: string }[] = [
  { value: 'beginner', label: 'Beginner', description: 'Little to no experience in this field' },
  { value: 'intermediate', label: 'Intermediate', description: 'Some foundational knowledge, looking to advance' },
  { value: 'advanced', label: 'Advanced', description: 'Strong background, targeting specialization' },
];

const FORMATS: { value: LearningFormat; label: string; icon: string }[] = [
  { value: 'video', label: 'Video Courses', icon: '🎬' },
  { value: 'articles', label: 'Articles & Docs', icon: '📖' },
  { value: 'hands-on', label: 'Hands-on Projects', icon: '🔨' },
  { value: 'mixed', label: 'Mixed (Recommended)', icon: '✨' },
];

const OBJECTIVES: { value: LearningObjective; label: string; icon: string }[] = [
  { value: 'job-readiness', label: 'Job Readiness', icon: '💼' },
  { value: 'academic', label: 'Academic Learning', icon: '🎓' },
  { value: 'career-change', label: 'Career Change', icon: '🔄' },
  { value: 'personal', label: 'Personal Development', icon: '🌱' },
];

const LOADING_MESSAGES = [
  'Analyzing your career goal...',
  'Mapping essential skills...',
  'Organizing your learning modules...',
  'Preparing hands-on projects...',
  'Customizing your timeline...',
  'Finalizing your roadmap...',
];

const INITIAL: OnboardingData = {
  careerGoal: '',
  customGoal: '',
  skillLevel: 'beginner',
  existingSkills: [],
  hoursPerDay: 2,
  targetDuration: 3,
  targetDurationUnit: 'months',
  learningFormat: 'mixed',
  learningObjective: 'job-readiness',
};

export default function Onboarding() {
  const { addPath, addToast, user } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 4;
  const [data, setData] = useState<OnboardingData>(INITIAL);
  const [skillInput, setSkillInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genMsgIdx, setGenMsgIdx] = useState(0);
  const [genError, setGenError] = useState(false);

  const update = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !data.existingSkills.includes(s)) {
      update('existingSkills', [...data.existingSkills, s]);
    }
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    update('existingSkills', data.existingSkills.filter(s => s !== skill));
  };

  const validateStep = () => {
    if (step === 1) return !!(data.careerGoal && (data.careerGoal !== 'Custom' || data.customGoal?.trim()));
    if (step === 2) return !!data.skillLevel;
    if (step === 3) return data.hoursPerDay > 0 && data.targetDuration > 0;
    return true;
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError(false);
    setGenMsgIdx(0);

    const interval = setInterval(() => {
      setGenMsgIdx(i => (i + 1) % LOADING_MESSAGES.length);
    }, 700);

    try {
      let path;

      try {
        // Attempt to use real backend (requires Supabase session + backend running)
        const { pathsService, backendPathToFrontend } = await import('../services/backendService');
        const backendPath = await pathsService.generate(data);
        path = backendPathToFrontend(backendPath);
        // Remove from localStorage — real data is in Supabase
      } catch (backendErr) {
        // Backend unavailable or not configured — fall back to demo mock
        const { generateLearningPath: mockGenerate } = await import('../services/roadmapService');
        const targetWeeks =
          data.targetDurationUnit === 'months'
            ? data.targetDuration * 4
            : data.targetDuration;

        path = await mockGenerate({
          careerGoal: data.careerGoal === 'Custom' ? (data.customGoal || 'Custom Path') : data.careerGoal,
          skillLevel: data.skillLevel,
          hoursPerDay: data.hoursPerDay,
          targetWeeks,
          learningFormat: data.learningFormat,
          learningObjective: data.learningObjective,
        });
      }

      addPath(path);
      addToast({ type: 'success', title: 'Learning path generated!', message: 'Your personalized roadmap is ready.' });
      clearInterval(interval);
      navigate(`/paths/${path.id}`);
    } catch {
      clearInterval(interval);
      setGenError(true);
      setGenerating(false);
    }
  };

  // Loading screen
  if (generating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF0EE] to-[#FFF8EE] dark:from-gray-950 dark:to-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#D85C4A] to-[#F3A65A] flex items-center justify-center mx-auto mb-8 shadow-xl animate-pulse">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <div className="w-8 h-8 border-4 border-[#F6C77B] border-t-indigo-600 rounded-full animate-spin mx-auto mb-6" />
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">{LOADING_MESSAGES[genMsgIdx]}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Building your personalized learning roadmap</p>
          <div className="mt-6 mx-auto max-w-48">
            <ProgressBar value={((genMsgIdx + 1) / LOADING_MESSAGES.length) * 100} animated />
          </div>
          <div className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-medium px-3 py-1 rounded-full mt-6">
            Interactive Demo — using predefined templates
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (genError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#140a08] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Generation Failed</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Something went wrong while generating your roadmap. Please try again.</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" leftIcon={<ChevronLeft className="w-4 h-4" />} onClick={() => { setStep(4); setGenError(false); }}>Back</Button>
            <Button leftIcon={<RotateCcw className="w-4 h-4" />} onClick={handleGenerate}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-[#FFF8EE] dark:from-gray-950 dark:to-gray-900 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-medium text-[#D85C4A] dark:text-[#E9825C] uppercase tracking-wide">Step {step} of {TOTAL_STEPS}</p>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
              {step === 1 && 'What is your career goal?'}
              {step === 2 && 'What is your current skill level?'}
              {step === 3 && 'Set your learning preferences'}
              {step === 4 && 'Review your learning profile'}
            </h1>
          </div>
          <button onClick={() => navigate(user ? '/dashboard' : '/')} className="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" aria-label="Cancel">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <ProgressBar value={(step / TOTAL_STEPS) * 100} size="sm" color="indigo" animated className="mb-8" />

        {/* Step card */}
        <div className="bg-white dark:bg-[#1c0f0d] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg p-8">

          {/* Step 1: Career Goal */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {CAREER_GOALS.filter(g => g !== 'Custom').map(goal => (
                  <button
                    key={goal}
                    onClick={() => update('careerGoal', goal)}
                    className={`p-3 text-left text-sm rounded-xl border-2 transition-all ${
                      data.careerGoal === goal
                        ? 'border-[#D85C4A] bg-[#FFF0EE] dark:bg-[#D85C4A]/15 text-[#C24E3D] dark:text-[#F3A65A] font-medium'
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-[#D85C4A] text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{goal}</span>
                      {data.careerGoal === goal && <Check className="w-4 h-4 text-[#D85C4A] dark:text-[#E9825C]" />}
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => update('careerGoal', 'Custom')}
                  className={`p-3 text-left text-sm rounded-xl border-2 transition-all col-span-2 ${
                    data.careerGoal === 'Custom'
                      ? 'border-[#D85C4A] bg-[#FFF0EE] dark:bg-[#D85C4A]/15'
                      : 'border-dashed border-gray-300 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-[#D85C4A]'
                  }`}
                >
                  <span className={data.careerGoal === 'Custom' ? 'text-[#C24E3D] dark:text-[#F3A65A] font-medium' : 'text-gray-500 dark:text-gray-400'}>+ Custom career goal</span>
                </button>
              </div>
              {data.careerGoal === 'Custom' && (
                <input
                  autoFocus
                  placeholder="e.g. DevOps Engineer, Game Developer..."
                  value={data.customGoal}
                  onChange={e => update('customGoal', e.target.value)}
                  className="w-full px-4 py-2.5 border border-indigo-300 dark:border-[#5c2e20] rounded-xl text-sm bg-white dark:bg-[#2a1410] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#D85C4A]"
                />
              )}
            </div>
          )}

          {/* Step 2: Skill level */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-3">
                {SKILL_LEVELS.map(level => (
                  <button
                    key={level.value}
                    onClick={() => update('skillLevel', level.value)}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                      data.skillLevel === level.value
                        ? 'border-[#D85C4A] bg-[#FFF0EE] dark:bg-[#D85C4A]/15'
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-[#D85C4A]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-semibold text-sm ${data.skillLevel === level.value ? 'text-[#C24E3D] dark:text-[#F3A65A]' : 'text-gray-800 dark:text-gray-200'}`}>{level.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{level.description}</p>
                      </div>
                      {data.skillLevel === level.value && <Check className="w-5 h-5 text-[#D85C4A] dark:text-[#E9825C]" />}
                    </div>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Existing skills (optional)</label>
                <div className="flex gap-2 mb-3">
                  <input
                    placeholder="e.g. Python, SQL..."
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-[#2a1410] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#D85C4A]"
                  />
                  <button onClick={addSkill} className="px-3 py-2 bg-[#FFE4E0] dark:bg-[#D85C4A]/20 text-[#C24E3D] dark:text-[#F3A65A] rounded-xl hover:bg-[#FCD5CE] dark:hover:bg- 
    $m = $args[0].Value
    switch -Regex ($m) {
      'indigo-50'   { 'bg-[#FFF0EE]' }; 'indigo-100'  { '[#FFE4E0]' }
      'indigo-200'  { '[#FCD5CE]' };     'indigo-300'  { '[#F9B4A8]' }
      'indigo-400'  { '[#E9825C]' };     'indigo-500'  { '[#D85C4A]' }
      'indigo-600'  { '[#C24E3D]' };     'indigo-700'  { '[#A84032]' }
      'indigo-900'  { '[#D85C4A]' };     default { $m }
    }
   transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {data.existingSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {data.existingSkills.map(s => (
                      <span key={s} className="inline-flex items-center gap-1 bg-[#FFF0EE] dark:bg-[#D85C4A]/15 text-[#C24E3D] dark:text-[#F3A65A] text-xs font-medium px-2.5 py-1 rounded-full">
                        {s}
                        <button onClick={() => removeSkill(s)} className="hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Hours per day
                  </label>
                  <select
                    value={data.hoursPerDay}
                    onChange={e => update('hoursPerDay', Number(e.target.value))}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-[#2a1410] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#D85C4A]"
                  >
                    {[0.5,1,1.5,2,3,4,5,6].map(h => <option key={h} value={h}>{h} hr{h !== 1 ? 's' : ''}/day</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Target className="w-4 h-4 inline mr-1" />
                    Target duration
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number" min="1" max="52"
                      value={data.targetDuration}
                      onChange={e => update('targetDuration', Number(e.target.value))}
                      className="w-16 px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-[#2a1410] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#D85C4A] text-center"
                    />
                    <select
                      value={data.targetDurationUnit}
                      onChange={e => update('targetDurationUnit', e.target.value as 'weeks' | 'months')}
                      className="flex-1 px-2 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-[#2a1410] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#D85C4A]"
                    >
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <BookOpen className="w-4 h-4 inline mr-1" />
                  Preferred learning format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {FORMATS.map(fmt => (
                    <button
                      key={fmt.value}
                      onClick={() => update('learningFormat', fmt.value)}
                      className={`p-3 text-left text-sm rounded-xl border-2 transition-all ${
                        data.learningFormat === fmt.value
                          ? 'border-[#D85C4A] bg-[#FFF0EE] dark:bg-[#D85C4A]/15 text-[#C24E3D] dark:text-[#F3A65A] font-medium'
                          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-[#D85C4A] text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span className="mr-2">{fmt.icon}</span>{fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Learning objective</label>
                <div className="grid grid-cols-2 gap-2">
                  {OBJECTIVES.map(obj => (
                    <button
                      key={obj.value}
                      onClick={() => update('learningObjective', obj.value)}
                      className={`p-3 text-left text-sm rounded-xl border-2 transition-all ${
                        data.learningObjective === obj.value
                          ? 'border-[#D85C4A] bg-[#FFF0EE] dark:bg-[#D85C4A]/15 text-[#C24E3D] dark:text-[#F3A65A] font-medium'
                          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-[#D85C4A] text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span className="mr-2">{obj.icon}</span>{obj.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-medium px-3 py-1 rounded-full">
                Interactive Demo · Predefined templates
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Career Goal', value: data.careerGoal === 'Custom' ? data.customGoal || 'Custom' : data.careerGoal },
                  { label: 'Skill Level', value: data.skillLevel.charAt(0).toUpperCase() + data.skillLevel.slice(1) },
                  { label: 'Study Time', value: `${data.hoursPerDay} hrs/day` },
                  { label: 'Target Duration', value: `${data.targetDuration} ${data.targetDurationUnit}` },
                  { label: 'Format', value: FORMATS.find(f => f.value === data.learningFormat)?.label ?? data.learningFormat },
                  { label: 'Objective', value: OBJECTIVES.find(o => o.value === data.learningObjective)?.label ?? data.learningObjective },
                ].map(item => (
                  <div key={item.label} className="p-3 bg-gray-50 dark:bg-[#2a1410] rounded-xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>

              {data.existingSkills.length > 0 && (
                <div className="p-3 bg-gray-50 dark:bg-[#2a1410] rounded-xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Existing Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {data.existingSkills.map(s => (
                      <span key={s} className="text-xs bg-[#FFE4E0] dark:bg-[#D85C4A]/20 text-[#C24E3D] dark:text-[#F3A65A] px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <button onClick={() => setStep(1)} className="text-[#D85C4A] dark:text-[#E9825C] hover:underline text-xs">Edit Goal</button>
                <span>·</span>
                <button onClick={() => setStep(2)} className="text-[#D85C4A] dark:text-[#E9825C] hover:underline text-xs">Edit Skills</button>
                <span>·</span>
                <button onClick={() => setStep(3)} className="text-[#D85C4A] dark:text-[#E9825C] hover:underline text-xs">Edit Preferences</button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="ghost"
            leftIcon={<ChevronLeft className="w-4 h-4" />}
            onClick={() => step > 1 ? setStep(s => s - 1) : navigate(user ? '/dashboard' : '/')}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>

          {step < TOTAL_STEPS ? (
            <Button
              disabled={!validateStep()}
              rightIcon={<ChevronRight className="w-4 h-4" />}
              onClick={() => setStep(s => s + 1)}
              id={`onboarding-next-step-${step}`}
            >
              Next
            </Button>
          ) : (
            <Button
              leftIcon={<Sparkles className="w-4 h-4" />}
              onClick={handleGenerate}
              id="generate-path-btn"
              className="shadow-lg shadow-[#F6C77B] dark:shadow-[#D85C4A]/20"
            >
              Generate Learning Path
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
