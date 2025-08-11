import React from 'react';

type Props = { message: string; onClose?: () => void; onRetry?: () => void };

export default function InlineToast({ message, onClose, onRetry }: Props) {
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded" role="alert" aria-live="polite">
      <span className="text-sm flex-1">{message}</span>
      {onRetry && (
        <button className="px-2 py-1 text-xs bg-red-600 text-white rounded" onClick={onRetry}>Retry</button>
      )}
      {onClose && (
        <button className="px-2 py-1 text-xs" onClick={onClose} aria-label="Dismiss">✕</button>
      )}
    </div>
  );
}


