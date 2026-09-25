// transcript.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLine } from './transcript.mjs';

const asst = JSON.stringify({
  type: 'assistant', isSidechain: false, sessionId: 's1',
  timestamp: '2026-09-24T06:26:20.542Z',
  message: { role: 'assistant', content: [
    { type: 'text', text: '⟦TRACK phase name=方案设计⟧ 开始' },
    { type: 'tool_use', id: 'tu1', name: 'Read' },
  ], usage: { input_tokens: 100, output_tokens: 20, cache_read_input_tokens: 5, cache_creation_input_tokens: 2 } },
});
const userTR = JSON.stringify({
  type: 'user', isSidechain: false, sessionId: 's1',
  timestamp: '2026-09-24T06:26:24.902Z',
  message: { role: 'user', content: [
    { type: 'tool_result', tool_use_id: 'tu1', is_error: false, content: 'hello world' },
  ] },
});

test('parse assistant line: usage + text + tool_use', () => {
  const e = parseLine(asst);
  assert.equal(e.role, 'assistant');
  assert.equal(e.usage.total, 127);
  assert.equal(e.texts[0].includes('⟦TRACK'), true);
  assert.deepEqual(e.toolUses, [{ id: 'tu1', name: 'Read' }]);
  assert.equal(e.ts, Date.parse('2026-09-24T06:26:20.542Z'));
});

test('parse user tool_result line: len + isError', () => {
  const e = parseLine(userTR);
  assert.equal(e.usage, null);
  assert.deepEqual(e.toolResults, [{ id: 'tu1', isError: false, len: 11 }]);
});

test('corrupt/truncated line returns null, does not throw', () => {
  assert.equal(parseLine('{"type":"assistant","message":{trunc'), null);
  assert.equal(parseLine(''), null);
});

test('line without timestamp returns null', () => {
  assert.equal(parseLine(JSON.stringify({ type: 'assistant', sessionId: 's1', message: {} })), null);
});

test('sidechain flag preserved', () => {
  const s = JSON.parse(asst); s.isSidechain = true;
  assert.equal(parseLine(JSON.stringify(s)).isSidechain, true);
});
