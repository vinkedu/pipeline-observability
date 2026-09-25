// ledger.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { parseLine } from './transcript.mjs';
import { buildPhases } from './session.mjs';

export function collectFile(rawText) {
  const events = [];
  for (const line of rawText.split('\n')) {
    const e = parseLine(line);
    if (e) events.push(e);
  }
  return buildPhases(events);
}

// 批量采集：单份 transcript 失败不阻断整体（spec §九）。
// deps 注入 { statSize(f), readText(f) } 以便测试；返回 {changed, failed, skipped, updates:Map<sessionId,lines[]>}
export function collectBatch(files, offsets, deps) {
  const updates = new Map();
  let changed = 0;
  let failed = 0;
  const skipped = [];
  for (const f of files) {
    try {
      const size = deps.statSize(f);
      if (offsets[f] === size) continue;
      const sessionId = f.replace('.jsonl', '');
      const phases = collectFile(deps.readText(f));
      updates.set(sessionId, phases.map((p) => JSON.stringify({ ...p, sessionId })));
      offsets[f] = size;
      changed++;
    } catch (err) {
      failed++;
      skipped.push({ file: f, code: err.code || err.message });
    }
  }
  return { changed, failed, skipped, updates };
}

export function readOffsets(path) {
  if (!existsSync(path)) return {};
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return {}; }
}

export function writeOffsets(path, obj) {
  writeFileSync(path, JSON.stringify(obj, null, 2));
}
