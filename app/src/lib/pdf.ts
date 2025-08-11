export type PdfPage = { index: number; text: string; textItemCount: number };

export async function extractPdfText(file: File): Promise<PdfPage[]> {
  const data = await file.arrayBuffer();
  const worker = new Worker(new URL('../workers/pdf.worker.ts', import.meta.url), { type: 'module' });
  return new Promise((resolve, reject) => {
    const onMessage = (ev: MessageEvent<any>) => {
      const payload = ev.data;
      worker.removeEventListener('message', onMessage);
      worker.terminate();
      if (payload?.error) return reject(new Error(payload.error));
      resolve(payload.pages as PdfPage[]);
    };
    worker.addEventListener('message', onMessage);
    worker.postMessage({ data });
  });
}


