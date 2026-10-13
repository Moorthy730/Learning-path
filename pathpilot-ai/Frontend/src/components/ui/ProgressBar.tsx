import React from 'react';

interface ProgressBarProps {
  value: number; // 0–100
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  /** Kept as original API. 'indigo' and 'violet' now map to Sunset Glow gradients. */
  color?: 'indigo' | 'violet' | 'emerald' | 'amber';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  className?: string;
}

const colorMap: Record<string, string> = {
  indigo:  'bg-gradient-to-r from-[#D85C4A] to-[#E9825C]',
  violet:  'bg-gradient-to-r from-[#E9825C] to-[#F3A65A]',
  emerald: 'bg-emerald-500',
  amber:   'bg-gradient-to-r from-[#F3A65A] to-[#F6C77B]',
};

const sizeMap = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };

export default function ProgressBar({
  value,
  max = 100,
  size = 'md',
  color = 'indigo',
  showLabel = false,
  label,
  animated = true,
  className = '',
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && (
            <span className="text-xs font-medium text-[#542E28]/70 dark:text-[#F6C77B]/70">
              {label}
            </span>
          )}
          {showLabel && (
            <span className="text-xs font-semibold text-[#542E28] dark:text-[#F6C77B]">
              {Math.round(pct)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-[#F9E3B5]/60 dark:bg-[#3a1c14] rounded-full overflow-hidden ${sizeMap[size]}`}>
        <div
          className={`${sizeMap[size]} ${colorMap[color] ?? colorMap.indigo} rounded-full ${animated ? 'transition-all duration-700 ease-out' : ''}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
