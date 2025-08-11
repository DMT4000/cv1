export function pathMatchesPattern(path: string, pattern: string): boolean {
  // Both are JSON Pointers beginning with '/'
  const pSegs = path.split('/').slice(1);
  const patSegs = pattern.split('/').slice(1);
  if (pSegs.length !== patSegs.length) return false;
  for (let i = 0; i < patSegs.length; i++) {
    const pat = patSegs[i];
    const seg = pSegs[i];
    if (pat === '*') continue;
    if (pat !== seg) return false;
  }
  return true;
}

export function isLockedPath(path: string, lockedPatterns: string[], unlockedExactPaths: string[] = []): boolean {
  if (unlockedExactPaths.includes(path)) return false;
  return lockedPatterns.some((pat) => pathMatchesPattern(path, pat));
}


