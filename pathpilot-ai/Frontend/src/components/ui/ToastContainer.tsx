import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import type { Toast } from '../../types';
import { useApp } from '../../context/AppContext';

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useApp();
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error:   <XCircle    className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-[#F3A65A]" />,
    info:    <Info        className="w-5 h-5 text-[#D85C4A]" />,
  };
  const borders = {
    success: 'border-l-emerald-500',
    error:   'border-l-red-500',
    warning: 'border-l-[#F3A65A]',
    info:    'border-l-[#D85C4A]',
  };

  return (
    <div className={`flex items-start gap-3 bg-white dark:bg-[#2a1410] border border-[#F6C77B]/40 dark:border-[#5c2e20]/60 border-l-4 ${borders[toast.type]} rounded-xl p-4 shadow-lg shadow-[#D85C4A]/10 min-w-72 max-w-sm animate-slide-in`}>
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#542E28] dark:text-[#F9E3B5]">{toast.title}</p>
        {toast.message && <p className="text-xs text-[#8B5447] dark:text-[#F6C77B]/70 mt-0.5">{toast.message}</p>}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-[#8B5447]/60 hover:text-[#D85C4A] dark:hover:text-[#F3A65A] transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts } = useApp();
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map(t => <ToastItem key={t.id} toast={t} />)}
    </div>
  );
}
