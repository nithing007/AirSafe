import React from 'react';

export function Card({ children, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={`surface-card p-6 sm:p-7 ${onClick ? 'cursor-pointer surface-card-hover' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const variants = {
    default: 'bg-slate-800/80 text-slate-300 border-slate-700/80',
    good: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    moderate: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    warning: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
    danger: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
    teal: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
    blue: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
  };

  const sizes = {
    sm: 'text-[11px] px-2.5 py-0.5',
    md: 'text-xs px-3 py-1',
    lg: 'text-sm px-3.5 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${variants[variant] || variants.default} ${sizes[size] || sizes.md} ${className}`}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  icon: Icon,
}) {
  const variants = {
    primary:
      'bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold shadow-sm hover:shadow active:scale-[0.98]',
    secondary:
      'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 active:scale-[0.98]',
    danger:
      'bg-rose-600 hover:bg-rose-500 text-white font-semibold active:scale-[0.98]',
    outline:
      'bg-transparent border border-slate-700 hover:border-slate-600 text-slate-200 hover:bg-slate-800/50',
    ghost:
      'bg-transparent text-slate-300 hover:text-white hover:bg-slate-800/60',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 rounded-lg',
    md: 'text-sm px-4 py-2.5 rounded-xl',
    lg: 'text-base px-6 py-3 rounded-xl font-semibold',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
}

export function LoadingSkeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-slate-800/50 rounded-2xl ${className}`} />
  );
}

export function ErrorAlert({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="rounded-2xl bg-rose-950/30 border border-rose-900/40 p-4 sm:p-5 text-rose-200 flex items-start justify-between gap-4">
      <div>
        <h4 className="font-semibold text-rose-300 text-sm">{title}</h4>
        <p className="text-xs text-rose-300/80 mt-1">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-semibold px-3 py-1.5 bg-rose-900/50 hover:bg-rose-900/80 border border-rose-700/50 text-rose-100 rounded-lg transition-colors shrink-0"
        >
          Try again
        </button>
      )}
    </div>
  );
}
