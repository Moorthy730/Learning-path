import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, Sparkles, X } from 'lucide-react';
import { CAREER_OPTIONS } from '../data/careers';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const colorBorderMap: Record<string, string> = {
  indigo: 'border-indigo-100 dark:border-indigo-900/40 hover:border-indigo-300',
  violet: 'border-violet-100 dark:border-violet-900/40 hover:border-violet-300',
  blue: 'border-blue-100 dark:border-blue-900/40 hover:border-blue-300',
  pink: 'border-pink-100 dark:border-pink-900/40 hover:border-pink-300',
  red: 'border-red-100 dark:border-red-900/40 hover:border-red-300',
  green: 'border-green-100 dark:border-green-900/40 hover:border-green-300',
  sky: 'border-sky-100 dark:border-sky-900/40 hover:border-sky-300',
  orange: 'border-orange-100 dark:border-orange-900/40 hover:border-orange-300',
};

const badgeColorMap: Record<string, 'indigo' | 'violet' | 'blue' | 'pink' | 'red' | 'green'> = {
  indigo: 'indigo',
  violet: 'violet',
  blue: 'blue',
  pink: 'pink',
  red: 'red',
  green: 'green',
};

const difficultyBadge: Record<string, 'emerald' | 'amber' | 'red'> = {
  beginner: 'emerald',
  intermediate: 'amber',
  advanced: 'red',
};

export default function ExploreCareers() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const filtered = CAREER_OPTIONS.filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.description.toLowerCase().includes(query.toLowerCase()) ||
    c.skills.some(s => s.toLowerCase().includes(query.toLowerCase()))
  );

  const handleGenerate = (title: string) => {
    navigate('/onboarding', { state: { preselectedGoal: title } });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Explore Career Paths</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
          Discover which career excites you most — then generate a personalized learning roadmap for it.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search careers or skills..."
          className="w-full pl-11 pr-10 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          id="careers-search"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Career Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400">No careers match your search. Try different keywords.</p>
          <button onClick={() => setQuery('')} className="mt-2 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">Clear search</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(career => (
            <div
              key={career.id}
              className={`bg-white dark:bg-gray-900 rounded-2xl border-2 ${colorBorderMap[career.color] ?? 'border-gray-100 hover:border-indigo-300'} p-5 flex flex-col gap-4 transition-all duration-200 hover:shadow-md dark:hover:border-opacity-60`}
            >
              <div>
                <div className="text-4xl mb-3">{career.icon}</div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm flex-1">{career.title}</h3>
                  <Badge color={difficultyBadge[career.difficulty]}>{career.difficulty}</Badge>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{career.description}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Key Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {career.skills.slice(0, 4).map(skill => (
                    <Badge key={skill} color={badgeColorMap[career.color] ?? 'indigo'} size="sm">{skill}</Badge>
                  ))}
                  {career.skills.length > 4 && (
                    <Badge color="gray" size="sm">+{career.skills.length - 4} more</Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{career.estimatedDuration}</span>
              </div>

              <Button
                size="sm"
                fullWidth
                leftIcon={<Sparkles className="w-4 h-4" />}
                onClick={() => handleGenerate(career.title)}
                id={`career-generate-${career.id}`}
              >
                Generate Roadmap
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
