import type { Suggestion } from '../types';

type JsonValue = any;

export type ApplyResult = {
  ok: boolean;
  value?: JsonValue;
  error?: string;
};

export function applyOperation(doc: JsonValue, op: Suggestion): ApplyResult {
  const cloned = deepClone(doc);
  const pointer = op.path;
  const pathTokens = parsePointer(pointer);
  if (pathTokens.length === 0) {
    return { ok: false, error: 'cannot operate on root' };
  }
  const parentPath = pathTokens.slice(0, -1);
  const lastToken = pathTokens[pathTokens.length - 1];
  const parent = getByTokens(cloned, parentPath);
  if (parent === undefined) return { ok: false, error: 'path_not_found' };

  if (Array.isArray(parent)) {
    const index = tokenToIndex(lastToken);
    if (index === null) return { ok: false, error: 'array_index_invalid' };
    switch (op.kind) {
      case 'replace': {
        if (index < 0 || index >= parent.length) return { ok: false, error: 'index_oob' };
        if (!('newValue' in op)) return { ok: false, error: 'missing_newValue' };
        parent[index] = op.newValue;
        break;
      }
      case 'insert': {
        if (!('newValue' in op)) return { ok: false, error: 'missing_newValue' };
        if (index < 0 || index > parent.length) return { ok: false, error: 'index_oob' };
        parent.splice(index, 0, op.newValue);
        break;
      }
      case 'delete': {
        if (index < 0 || index >= parent.length) return { ok: false, error: 'index_oob' };
        parent.splice(index, 1);
        break;
      }
    }
  } else if (isObject(parent)) {
    const key = unescapeToken(lastToken);
    switch (op.kind) {
      case 'replace': {
        if (!Object.prototype.hasOwnProperty.call(parent, key)) return { ok: false, error: 'key_not_found' };
        if (!('newValue' in op)) return { ok: false, error: 'missing_newValue' };
        (parent as any)[key] = op.newValue;
        break;
      }
      case 'insert': {
        if (!('newValue' in op)) return { ok: false, error: 'missing_newValue' };
        (parent as any)[key] = op.newValue;
        break;
      }
      case 'delete': {
        if (!Object.prototype.hasOwnProperty.call(parent, key)) return { ok: false, error: 'key_not_found' };
        delete (parent as any)[key];
        break;
      }
    }
  } else {
    return { ok: false, error: 'parent_not_container' };
  }

  return { ok: true, value: cloned };
}

export function applyPatchSequence(doc: JsonValue, patch: Suggestion[]): ApplyResult {
  let current = deepClone(doc);
  for (const op of patch) {
    const res = applyOperation(current, op);
    if (!res.ok) return res;
    current = res.value;
  }
  return { ok: true, value: current };
}

function parsePointer(pointer: string): string[] {
  if (!pointer.startsWith('/')) return [];
  return pointer
    .split('/')
    .slice(1)
    .map((t) => t.replace(/~1/g, '/').replace(/~0/g, '~'));
}

function unescapeToken(token: string): string {
  return token.replace(/~1/g, '/').replace(/~0/g, '~');
}

function tokenToIndex(token: string): number | null {
  if (token === '-') return null;
  const n = Number(token);
  if (!Number.isInteger(n)) return null;
  return n;
}

function getByTokens(root: any, tokens: string[]): any {
  let cur = root;
  for (const token of tokens) {
    const key = unescapeToken(token);
    if (Array.isArray(cur)) {
      const idx = tokenToIndex(token);
      if (idx === null || idx < 0 || idx >= cur.length) return undefined;
      cur = cur[idx];
    } else if (isObject(cur)) {
      if (!Object.prototype.hasOwnProperty.call(cur, key)) return undefined;
      cur = (cur as any)[key];
    } else {
      return undefined;
    }
  }
  return cur;
}

function isObject(v: any): v is Record<string, any> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}


