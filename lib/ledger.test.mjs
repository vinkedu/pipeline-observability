// ledger.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectFile, collectBatch } from './ledger.mjs';

function line(o) { return JSON.stringify(o); }

test('collectFile: full transcript text -> phase records with token conservation', () => {
  const raw = [
    line({ type: 'assistant', sessionId: 's1', timestamp: '2026-09-24T06:00:00.000Z',
      message: { role: 'assistant', content: [{ type: 'text', text: '⟦TRACK wf rdc=r1 id=w1 title="x"⟧⟦TRACK phase name=A⟧' }],
        usage: { input_tokens: 100, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } } }),
    'GARBAGE TRUNCATED {',
    line({ type: 'assistant', sessionId: 's1', timestamp: '2026-09-24T06:01:00.000Z',
      message: { role: 'assistant', content: [{ type: 'text', text: '⟦TRACK phase name=B⟧' }],
        usage: { input_tokens: 30, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } } }),
  ].join('\n');
  const ph = collectFile(raw);
  const total = ph.reduce((s, p) => s + p.tokens.total, 0);
  assert.equal(total, 130);
  assert.equal(ph.find((p) => p.phase === 'A').rdc, 'r1');
});

test('collectFile: empty text -> empty array, no throw', () => {
  assert.deepEqual(collectFile(''), []);
});

test('collectBatch: one bad file does not abort the batch (spec §九)', () => {
  const good = line({ type: 'assistant', sessionId: 'g1', timestamp: '2026-09-24T06:00:00.000Z',
    message: { role: 'assistant', content: [{ type: 'text', text: '⟦TRACK wf rdc=r1 id=w1 title="x"⟧⟦TRACK phase name=A⟧' }],
      usage: { input_tokens: 10, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } } });
  const deps = {
    statSize: (f) => (f === 'bad.jsonl' ? (() => { const e = new Error('gone'); e.code = 'ENOENT'; throw e; })() : 1),
    readText: (f) => good,
  };
  const offsets = {};
  const r = collectBatch(['bad.jsonl', 'good.jsonl'], offsets, deps);
  assert.equal(r.failed, 1);
  assert.equal(r.changed, 1);           // 坏文件不阻断，好文件照常采
  assert.equal(r.skipped[0].code, 'ENOENT');
  assert.equal(r.updates.has('good'), true);
  assert.equal(offsets['good.jsonl'], 1); // 成功文件 offset 已更新
  assert.equal('bad.jsonl' in offsets, false); // 失败文件不写 offset，下轮重试
});

test('collectBatch: unchanged file (offset==size) is skipped', () => {
  const deps = { statSize: () => 5, readText: () => { throw new Error('should not read'); } };
  const r = collectBatch(['x.jsonl'], { 'x.jsonl': 5 }, deps);
  assert.equal(r.changed, 0);
  assert.equal(r.failed, 0);
});
