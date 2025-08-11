/// <reference lib="webworker" />
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
// pdfjs worker will be resolved by vite via worker plugin or default dist path

export type PdfIn = { data: ArrayBuffer };
export type PdfOut = { pages: { index: number; text: string; textItemCount: number }[] };

self.addEventListener('message', async (ev: MessageEvent<PdfIn>) => {
  try {
    const task = getDocument({ data: ev.data.data });
    const pdf = await task.promise;
    const pages: PdfOut['pages'] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const items = content.items as any[];
      const text = items.map((it) => (it.str ?? '')).join(' ');
      pages.push({ index: i - 1, text, textItemCount: items.length });
    }
    const out: PdfOut = { pages };
    // @ts-ignore
    self.postMessage(out);
  } catch (err: any) {
    // @ts-ignore
    self.postMessage({ error: err?.message || String(err) });
  }
});


