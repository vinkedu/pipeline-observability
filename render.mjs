// render.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { aggregate } from './lib/aggregate.mjs';
import { renderHtml } from './lib/html.mjs';

const OUT = 'D:/Projects/.claude/workspace-cache/pipeline-observability';
const LEDGER = join(OUT, 'phases.ndjson');
const HTML = join(OUT, 'dashboard.html');

const phases = [];
if (existsSync(LEDGER)) {
  for (const line of readFileSync(LEDGER, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try { phases.push(JSON.parse(line)); } catch { /* skip */ }
  }
}
writeFileSync(HTML, renderHtml(aggregate(phases)));
console.log(`render: ${phases.length} phase(s) -> ${HTML}`);
