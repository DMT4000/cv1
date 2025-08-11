export type IngestPage = { index: number; mode: 'text' | 'image'; text?: string };
export type IngestResult = {
  pages: IngestPage[];
  meta: { pageCount: number; fileType: 'pdf' | 'docx' | 'img'; filename: string };
  flags: string[];
};

export async function processFiles(files: File[]): Promise<IngestResult> {
  // Stub for T3.1 acceptance
  const file = files[0];
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const fileType: IngestResult['meta']['fileType'] = ext === 'pdf' ? 'pdf' : ext === 'docx' ? 'docx' : 'img';
  return {
    pages: [],
    meta: { pageCount: 0, fileType, filename: file.name },
    flags: [],
  };
}


