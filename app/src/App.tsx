import React from 'react';
import IngestPane from './components/IngestPane';
import PreviewPane from './components/PreviewPane';

export default function App() {
  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">CV Cursor</h1>
      <div className="grid grid-cols-2 gap-4">
        <IngestPane />
        <PreviewPane />
      </div>
    </div>
  );
}


