export function assembleRawText(pages: { index: number; text?: string }[]): string {
  return pages
    .map((p) => `\n\n===== Page ${p.index + 1} =====\n` + (p.text || ''))
    .join('');
}


