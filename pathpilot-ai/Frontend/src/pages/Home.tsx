import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Navigation, Sparkles, ArrowRight, CheckCircle,
  Brain, Target, TrendingUp, Users, Star,
  BookOpen, Zap, Award, ChevronRight, Menu, X
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const FEATURES = [
  { icon: Brain, title: 'AI-Powered Personalization', description: 'Roadmaps tailored to your unique career goals, experience level, and available learning time.', color: 'indigo' },
  { icon: Target, title: 'Structured Learning Stages', description: 'Step-by-step modules organized in the right order so you never feel lost or overwhelmed.', color: 'secondary' },
  { icon: TrendingUp, title: 'Real-Time Progress Tracking', description: 'Monitor completion rates, learning streaks, and milestones across all your learning paths.', color: 'accent' },
  { icon: BookOpen, title: 'Curated Resources', description: 'Handpicked videos, articles, and hands-on projects for every lesson.', color: 'emerald' },
  { icon: Zap, title: 'Fast Generation', description: 'Get a complete, detailed roadmap in seconds. No waiting, no complexity.', color: 'amber' },
  { icon: Award, title: 'Achievement System', description: 'Stay motivated with streaks, badges, and milestone celebrations.', color: 'pink' },
];

const EXAMPLE_PATHS = [
  { icon: '💻', title: 'Full Stack Developer', duration: '6–12 months', level: 'Beginner–Intermediate', color: 'from-[#FFF0EE] to-[#FFF8EE] border-[#F9E3B5]' },
  { icon: '🤖', title: 'AI/ML Engineer', duration: '8–14 months', level: 'Intermediate–Advanced', color: 'from-[#FFF4EE] to-[#FFF4EE] border-[#F6C77B]' },
  { icon: '📊', title: 'Data Analyst', duration: '4–8 months', level: 'Beginner', color: 'from-[#FFF8F0] to-[#FFF8EE] border-[#F6C77B]' },
  { icon: '🎨', title: 'UI/UX Designer', duration: '4–8 months', level: 'Beginner', color: 'from-[#FFF0EE] to-[#FFF4EE] border-[#F9E3B5]' },
  { icon: '🔐', title: 'Cybersecurity Analyst', duration: '6–12 months', level: 'Intermediate', color: 'from-[#FFF8F0] to-[#FFF4EC] border-[#F6C77B]' },
  { icon: '☁️', title: 'Cloud Engineer', duration: '6–10 months', level: 'Intermediate', color: 'from-[#FFF8F0] to-[#FFF0E8] border-[#F6C77B]' },
];

const STEPS = [
  { number: '01', title: 'Tell Us Your Goal', description: 'Choose from popular career paths or enter a custom goal. Share your current skills and available study time.' },
  { number: '02', title: 'Get Your Roadmap', description: 'Our AI generates a personalized, stage-by-stage learning roadmap tailored exactly to your profile.' },
  { number: '03', title: 'Start Learning', description: 'Follow your roadmap, track progress, complete lessons, and reach your career goal with confidence.' },
];

export default function Home() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleGetStarted = () => {
    if (user) navigate('/onboarding');
    else navigate('/signup');
  };

  const handleExploreDemo = () => {
    navigate('/demo-entry');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#140a08] font-['Inter',sans-serif]">
      {/* Navbar */}
      <nav className={`sticky top-0 z-50 transition-all duration-200 ${scrolled ? 'bg-white/90 dark:bg-[#1c0f0d]/90 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D85C4A] to-[#F3A65A] flex items-center justify-center shadow-sm">
              <Navigation className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">PathPilot AI</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#D85C4A] dark:hover:text-[#E9825C] transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#D85C4A] dark:hover:text-[#E9825C] transition-colors">How It Works</a>
            <a href="#examples" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#D85C4A] dark:hover:text-[#E9825C] transition-colors">Careers</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link to="/dashboard" className="inline-flex items-center gap-2 bg-[#D85C4A] hover:bg-[#C24E3D] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link to="/signin" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#D85C4A] dark:hover:text-[#E9825C] transition-colors px-3 py-2">Sign In</Link>
                <Link to="/signup" className="inline-flex items-center gap-2 bg-[#D85C4A] hover:bg-[#C24E3D] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm">
                  Get Started <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-[#1c0f0d] border-t border-gray-100 dark:border-gray-800 px-4 py-4 space-y-3">
            <a href="#features" className="block text-sm text-gray-600 py-2" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className="block text-sm text-gray-600 py-2" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="#examples" className="block text-sm text-gray-600 py-2" onClick={() => setMobileMenuOpen(false)}>Careers</a>
            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
              <Link to="/signin" className="text-sm font-medium text-center text-gray-600 py-2">Sign In</Link>
              <Link to="/signup" className="bg-[#D85C4A] text-white text-sm font-semibold px-4 py-2.5 rounded-xl text-center">Get Started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-[#FFF0EE] dark:bg-[#D85C4A]/15 border border-[#F9E3B5] dark:border-[#D85C4A]/30 text-[#C24E3D] dark:text-[#F3A65A] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          AI-Powered Learning Roadmaps
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight mb-6">
          Your Career Goals.<br />
          <span className="bg-gradient-to-r from-[#D85C4A] via-[#E9825C] to-[#F3A65A] bg-clip-text text-transparent">Your Personalized</span><br />
          Learning Path.
        </h1>

        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          PathPilot AI creates stage-by-stage, personalized learning roadmaps based on your career goals,
          current skills, and available time. Stop guessing what to learn next.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            id="hero-cta-primary"
            onClick={handleGetStarted}
            className="inline-flex items-center gap-2 bg-[#D85C4A] hover:bg-[#C24E3D] text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-[#D85C4A]/30 transition-all hover:scale-105 text-base"
          >
            <Sparkles className="w-5 h-5" />
            Generate My Learning Path
          </button>
          <button
            id="hero-cta-secondary"
            onClick={handleExploreDemo}
            className="inline-flex items-center gap-2 border border-[#F6C77B] dark:border-[#5c2e20] bg-white dark:bg-[#2a1410] text-[#542E28] dark:text-[#F6C77B] font-semibold px-8 py-3.5 rounded-xl hover:border-[#D85C4A] dark:hover:border-[#E9825C] transition-all text-base"
          >
            Explore Demo
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-2">
              {['🧑‍💻','👩‍💼','🧑‍🎨','👨‍🔬'].map((em, i) => (
                <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-[#D85C4A] to-[#F3A65A] flex items-center justify-center text-sm border-2 border-white">{em}</div>
              ))}
            </div>
            <span>2,400+ learners</span>
          </div>
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
            <span className="ml-1">4.9/5</span>
          </div>
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 -mt-4 mb-24">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1c0f0d] shadow-2xl overflow-hidden">
          {/* Mock browser bar */}
          <div className="h-10 bg-gray-50 dark:bg-[#2a1410] border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
            <div className="flex-1 mx-4 bg-gray-200 dark:bg-gray-700 rounded text-xs text-gray-500 text-center py-0.5 px-2 max-w-xs mx-auto">pathpilot.ai/dashboard</div>
          </div>
          {/* Mock dashboard content */}
          <div className="p-6 bg-gray-50 dark:bg-[#140a08] flex gap-4">
            {/* Sidebar mockup */}
            <div className="hidden sm:flex flex-col w-36 gap-2">
              {['Overview','My Paths','Generate','Explore','Analytics'].map((item, i) => (
                <div key={item} className={`text-xs px-3 py-1.5 rounded-lg ${i === 0 ? 'bg-[#FFF0EE] dark:bg-[#D85C4A]/20 text-[#C24E3D] dark:text-[#F3A65A] font-medium' : 'text-gray-500 dark:text-gray-400'}`}>{item}</div>
              ))}
            </div>
            {/* Main content mockup */}
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Learning Paths', value: '3' },
                  { label: 'Lessons Done', value: '34' },
                  { label: 'Study Hours', value: '47.5' },
                  { label: 'Day Streak', value: '🔥 6' },
                ].map(card => (
                  <div key={card.label} className="bg-white dark:bg-[#2a1410] rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{card.value}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{card.label}</div>
                  </div>
                ))}
              </div>
              {/* Progress bar mockup */}
              <div className="bg-white dark:bg-[#2a1410] rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Full Stack Developer</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full w-[42%] bg-gradient-to-r from-[#D85C4A] to-[#F3A65A] rounded-full" />
                  </div>
                  <span className="text-xs font-semibold text-[#D85C4A]">42%</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">Stage 2 of 6 · React & Frontend</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Everything You Need to Learn Smarter</h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">A complete learning companion — from roadmap generation to progress tracking.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, description, color }) => (
            <div key={title} className="group p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1c0f0d] hover:border-[#F6C77B] dark:hover:border-[#D85C4A]/40 hover:shadow-md transition-all duration-200">
              <div className={`w-11 h-11 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 text-${color}-600 dark:text-${color}-400`} />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-gray-50 dark:bg-[#1c0f0d] py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">Three simple steps to your personalized roadmap.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map(step => (
              <div key={step.number} className="relative text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#D85C4A] to-[#F3A65A] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#F6C77B] dark:shadow-[#D85C4A]/20">
                  <span className="text-white font-bold text-xl">{step.number}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{step.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example Paths */}
      <section id="examples" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Popular Career Paths</h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">Explore what a PathPilot roadmap looks like for different careers.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {EXAMPLE_PATHS.map(path => (
            <div key={path.title} className={`p-5 rounded-2xl border bg-gradient-to-br ${path.color} dark:bg-none dark:bg-[#1c0f0d] dark:border-gray-700 hover:shadow-md transition-all`}>
              <div className="text-3xl mb-3">{path.icon}</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{path.title}</h3>
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <span>{path.duration}</span>
                <span>·</span>
                <span>{path.level}</span>
              </div>
              <button
                onClick={handleGetStarted}
                className="mt-4 text-sm font-semibold text-[#D85C4A] dark:text-[#E9825C] hover:text-[#D85C4A]/40 dark:hover:text-[#F3A65A] flex items-center gap-1 transition-colors"
              >
                Generate this path <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-gradient-to-br from-[#D85C4A] to-[#E9825C] py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Why Learners Love PathPilot AI</h2>
          <div className="grid sm:grid-cols-3 gap-8 mt-12">
            {[
              { stat: '3× faster', label: 'Reach your goals 3× faster with structured roadmaps vs. self-study.' },
              { stat: '94%', label: 'Of learners report feeling more confident about their career direction.' },
              { stat: '2,400+', label: 'Learning paths generated and counting — across 8 career tracks.' },
            ].map(item => (
              <div key={item.stat} className="text-center">
                <div className="text-4xl font-bold text-white mb-2">{item.stat}</div>
                <p className="text-indigo-200 text-sm leading-relaxed">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-[#FFF0EE] dark:bg-[#D85C4A]/15 border border-[#F9E3B5] dark:border-[#D85C4A]/40 text-[#C24E3D] dark:text-[#F3A65A] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <CheckCircle className="w-3.5 h-3.5" />
          Free to start · No credit card required
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">Ready to Find Your Path?</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Generate your personalized learning roadmap in under a minute.</p>
        <button
          id="final-cta"
          onClick={handleGetStarted}
          className="inline-flex items-center gap-2 bg-[#D85C4A] hover:bg-[#C24E3D] text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-[#F6C77B] dark:shadow-[#D85C4A]/20 transition-all hover:scale-105 text-base"
        >
          <Sparkles className="w-5 h-5" />
          Generate My Learning Path
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#D85C4A] to-[#F3A65A] flex items-center justify-center">
                <Navigation className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-sm">PathPilot AI</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <Link to="/signup" className="hover:text-[#D85C4A] dark:hover:text-[#E9825C] transition-colors">Get Started</Link>
              <Link to="/signin" className="hover:text-[#D85C4A] dark:hover:text-[#E9825C] transition-colors">Sign In</Link>
              <a href="#features" className="hover:text-[#D85C4A] dark:hover:text-[#E9825C] transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-[#D85C4A] dark:hover:text-[#E9825C] transition-colors">How It Works</a>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">© 2026 PathPilot AI · Interactive Demo · Not Production Ready</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
