// reconcile.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { collectFile } from './ledger.mjs';
import { parseLine } from './transcript.mjs';

const SAMPLE = 'C:/Users/kaiwen_du/.claude/projects/d--Projects/ac75b7ee-3dce-4480-999d-5aa0cb610b74.jsonl';

test('token conservation on real golden sample', { skip: !existsSync(SAMPLE) }, () => {
  const raw = readFileSync(SAMPLE, 'utf8');
  let expected = 0;
  for (const line of raw.split('\n')) {
    const e = parseLine(line);
    if (e && e.usage) expected += e.usage.total;
  }
  const phases = collectFile(raw);
  const got = phases.reduce((s, p) => s + p.tokens.total, 0);
  assert.equal(got, expected);
});
