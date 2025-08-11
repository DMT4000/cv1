import React from 'react';
import { useAppState } from '../store/appState';

export default function MetricsPanel() {
  const { metrics } = useAppState();
  if (!metrics) return null;
  return (
    <div className="border p-3 rounded text-sm">
      <div className="font-semibold">Metrics</div>
      <div>Score: {metrics.score}</div>
      <div>Used: {metrics.used.join(', ') || '-'}</div>
      <div>Missing: {metrics.missing.join(', ') || '-'}</div>
    </div>
  );
}


