/// <reference lib="webworker" />
import Tesseract from 'tesseract.js';

export type OcrInput = { imageData: ImageData; lang?: string };
export type OcrOutput = { text: string; conf: number };

self.addEventListener('message', async (ev: MessageEvent<OcrInput>) => {
  try {
    const { imageData, lang = 'eng' } = ev.data;
    const { data } = await Tesseract.recognize(imageData, lang);
    const out: OcrOutput = { text: data.text || '', conf: data.confidence || 0 };
    // @ts-ignore
    self.postMessage(out);
  } catch (err: any) {
    // @ts-ignore
    self.postMessage({ error: err?.message || String(err) });
  }
});


