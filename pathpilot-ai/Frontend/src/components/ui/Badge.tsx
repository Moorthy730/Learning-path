import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  color?: 'indigo' | 'violet' | 'blue' | 'green' | 'amber' | 'red' | 'pink' | 'gray' | 'emerald';
  size?: 'sm' | 'md';
  variant?: 'solid' | 'soft';
  className?: string;
}

const colorMap = {
  indigo: { solid: 'bg-indigo-600 text-white', soft: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
  violet: { solid: 'bg-violet-600 text-white', soft: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
  blue: { solid: 'bg-blue-600 text-white', soft: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  green: { solid: 'bg-green-600 text-white', soft: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  amber: { solid: 'bg-amber-500 text-white', soft: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  red: { solid: 'bg-red-600 text-white', soft: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  pink: { solid: 'bg-pink-600 text-white', soft: 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' },
  gray: { solid: 'bg-gray-600 text-white', soft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  emerald: { solid: 'bg-emerald-600 text-white', soft: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
};

export default function Badge({ children, color = 'indigo', size = 'sm', variant = 'soft', className = '' }: BadgeProps) {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${sizeClass} ${colorMap[color][variant]} ${className}`}>
      {children}
    </span>
  );
}
