import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadPack(filename: string): string[] {
  const filePath = join(__dirname, 'packs', filename);
  const content = readFileSync(filePath, 'utf-8');
  return [...new Set(content.split('\n').map(w => w.trim()).filter(Boolean))];
}

let _en: string[] | null = null;
let _th: string[] | null = null;

export function getEnWords(): string[] {
  if (!_en) _en = loadPack('en.txt');
  return _en;
}

export function getThWords(): string[] {
  if (!_th) _th = loadPack('th.txt');
  return _th;
}

export function resetCache(): void {
  _en = null;
  _th = null;
}
