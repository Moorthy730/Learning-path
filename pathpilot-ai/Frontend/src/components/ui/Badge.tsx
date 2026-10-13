import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  color?: 'indigo' | 'violet' | 'blue' | 'green' | 'amber' | 'red' | 'pink' | 'gray' | 'emerald';
  size?: 'sm' | 'md';
  variant?: 'solid' | 'soft';
  className?: string;
}

/**
 * Badge — Sunset Glow palette.
 * The color prop API is intentionally preserved so existing call-sites don't need
 * updating. Each name maps to a warm Sunset Glow tint:
 *   indigo  → primary  (#D85C4A family)
 *   violet  → secondary (#E9825C family)
 *   blue    → accent   (#F3A65A family)
 *   amber   → highlight (#F6C77B family)
 *   emerald → kept green (progress/success contexts)
 *   Others  → kept as neutral tones
 */
const colorMap: Record<string, { solid: string; soft: string }> = {
  // Primary — warm coral-red
  indigo: {
    solid: 'bg-[#D85C4A] text-white',
    soft:  'bg-[#FFF0EE] text-[#D85C4A] dark:bg-[#D85C4A]/20 dark:text-[#F6C77B]',
  },
  // Secondary — sunset orange
  violet: {
    solid: 'bg-[#E9825C] text-white',
    soft:  'bg-[#FFF4EE] text-[#C06240] dark:bg-[#E9825C]/20 dark:text-[#F6C77B]',
  },
  // Accent — warm amber
  blue: {
    solid: 'bg-[#F3A65A] text-[#542E28]',
    soft:  'bg-[#FFF8EE] text-[#9B5C25] dark:bg-[#F3A65A]/20 dark:text-[#F6C77B]',
  },
  green: {
    solid: 'bg-emerald-600 text-white',
    soft:  'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  amber: {
    solid: 'bg-[#F6C77B] text-[#542E28]',
    soft:  'bg-[#FFFBF0] text-[#9B5C25] dark:bg-[#F6C77B]/20 dark:text-[#F6C77B]',
  },
  red: {
    solid: 'bg-red-600 text-white',
    soft:  'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  },
  pink: {
    solid: 'bg-[#E9825C] text-white',
    soft:  'bg-[#FFF4EE] text-[#C06240] dark:bg-[#E9825C]/20 dark:text-[#F3A65A]',
  },
  gray: {
    solid: 'bg-stone-600 text-white',
    soft:  'bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-300',
  },
  emerald: {
    solid: 'bg-emerald-600 text-white',
    soft:  'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
};

export default function Badge({
  children,
  color = 'indigo',
  size = 'sm',
  variant = 'soft',
  className = '',
}: BadgeProps) {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeClass} ${colorMap[color][variant]} ${className}`}
    >
      {children}
    </span>
  );
}
