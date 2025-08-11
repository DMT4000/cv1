import React from 'react';
import PDFPreview from '../components/PDFPreview';

export default function ExportPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Export</h2>
      <PDFPreview />
      <button onClick={() => window.print()} className="px-3 py-1 bg-gray-200 rounded">Export PDF</button>
    </div>
  );
}


