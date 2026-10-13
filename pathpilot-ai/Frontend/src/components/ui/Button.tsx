import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variants = {
  primary:
    'bg-[#D85C4A] hover:bg-[#C24E3D] active:bg-[#A84032] text-white shadow-sm shadow-[#D85C4A]/30',
  secondary:
    'bg-[#E9825C] hover:bg-[#D97250] active:bg-[#C06240] text-white shadow-sm shadow-[#E9825C]/25',
  outline:
    'border border-[#F3A65A] bg-white dark:bg-[#2a1410] text-[#D85C4A] dark:text-[#F3A65A] hover:bg-[#FFF4EC] dark:hover:bg-[#3a1c14]',
  ghost:
    'bg-transparent text-[#542E28] dark:text-[#F6C77B] hover:bg-[#FFF4EC] dark:hover:bg-[#2a1410]',
  danger:
    'bg-red-600 hover:bg-red-700 text-white shadow-sm',
};

const sizes = {
  sm: 'text-sm px-3 py-1.5 rounded-lg gap-1.5',
  md: 'text-sm px-4 py-2.5 rounded-xl gap-2',
  lg: 'text-base px-6 py-3 rounded-xl gap-2.5',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-semibold transition-all duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D85C4A] focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}
      `}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
