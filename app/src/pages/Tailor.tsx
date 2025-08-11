import React from 'react';
import JDPanel from '../components/JDPanel';
import MetricsPanel from '../components/MetricsPanel';
import DiagnosisPanel from '../components/DiagnosisPanel';

export default function TailorPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Tailor</h2>
      <JDPanel />
      <MetricsPanel />
      <DiagnosisPanel />
    </div>
  );
}


