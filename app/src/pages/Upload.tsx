import React from 'react';
import { useNavigate } from 'react-router-dom';
import IngestPane from '../components/IngestPane';

export default function UploadPage() {
  const navigate = useNavigate();

  async function useSample(path: string) {
    try {
      const resp = await fetch(path);
      const txt = await resp.text();
      localStorage.setItem('rawText', txt);
      localStorage.setItem('rawTextLen', String(txt.length));
      localStorage.setItem('ocr_used', 'false');
      navigate('/structure');
    } catch (e) {
      // no-op
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Upload</h2>
      <IngestPane />
      <div className="flex gap-2">
        <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => useSample('/fixtures/sample_raw.txt')}>
          Use sample clean.pdf
        </button>
        <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => useSample('/fixtures/sample_raw.txt')}>
          Use sample scan.png
        </button>
      </div>
    </div>
  );
}


