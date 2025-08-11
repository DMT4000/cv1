import React, { useCallback, useState } from 'react';
import { processFiles } from '../lib/ingest';

export default function IngestPane() {
  const [status, setStatus] = useState<string>('Drop a file or click to upload');

  const onFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setStatus('Processing...');
    try {
      const result = await processFiles(Array.from(files));
      setStatus(`Processed: ${result.meta.filename} (${result.meta.fileType}), pages=${result.pages.length}`);
      localStorage.setItem('rawTextLen', String((result.pages || []).map(p => p.text || '').join('').length));
      localStorage.setItem('ocr_used', String((result.flags || []).includes('ocr_used')));
    } catch (e: any) {
      setStatus(`Error: ${e?.message || e}`);
    }
  }, []);

  return (
    <div className="p-4 border rounded bg-white">
      <label className="block p-6 border-2 border-dashed rounded cursor-pointer text-center">
        <input
          type="file"
          className="hidden"
          multiple={false}
          onChange={(e) => onFiles(e.target.files)}
          accept=".pdf,.docx,.png,.jpg,.jpeg,.webp"
        />
        <div>{status}</div>
      </label>
    </div>
  );
}


