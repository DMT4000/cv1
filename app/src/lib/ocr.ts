export type OcrResult = { text: string; conf: number };

export async function runOcrOnCanvas(
  canvas: HTMLCanvasElement,
  lang: string = 'eng'
): Promise<OcrResult> {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no canvas context');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const worker = new Worker(new URL('../workers/ocr.worker.ts', import.meta.url), { type: 'module' });
  return new Promise((resolve, reject) => {
    const onMessage = (ev: MessageEvent<any>) => {
      worker.removeEventListener('message', onMessage);
      worker.terminate();
      if (ev.data?.error) return reject(new Error(ev.data.error));
      resolve(ev.data as OcrResult);
    };
    worker.addEventListener('message', onMessage);
    worker.postMessage({ imageData, lang });
  });
}


