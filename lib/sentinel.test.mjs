import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSentinels } from './sentinel.mjs';

test('parse wf line with quoted title containing spaces', () => {
  const r = parseSentinels('⟦TRACK wf rdc=monitor-kb id=a1b2c3d4 title="埋点 监控 MVP"⟧');
  assert.deepEqual(r, [{ kind: 'wf', rdc: 'monitor-kb', id: 'a1b2c3d4', title: '埋点 监控 MVP' }]);
});

test('parse phase line, nth defaults to 1 when absent', () => {
  const r = parseSentinels('⟦TRACK phase name=方案设计⟧');
  assert.deepEqual(r, [{ kind: 'phase', name: '方案设计', nth: 1 }]);
});

test('parse phase with explicit nth', () => {
  const r = parseSentinels('⟦TRACK phase name=方案设计 nth=2⟧');
  assert.equal(r[0].nth, 2);
});

test('parse gate line', () => {
  const r = parseSentinels('⟦TRACK gate phase=门禁检查 result=PASS⟧');
  assert.deepEqual(r, [{ kind: 'gate', phase: '门禁检查', result: 'PASS' }]);
});

test('ignore malformed / unknown kind, extract valid ones from multiline', () => {
  const txt = '前言\n⟦TRACK bogus foo=1⟧\n中间 ⟦TRACK phase name=TDD实现⟧ 尾\n⟦TRACK⟧';
  const r = parseSentinels(txt);
  assert.deepEqual(r, [{ kind: 'phase', name: 'TDD实现', nth: 1 }]);
});

test('gate with invalid result is dropped', () => {
  assert.deepEqual(parseSentinels('⟦TRACK gate phase=x result=MAYBE⟧'), []);
});

test('wf missing rdc is dropped', () => {
  assert.deepEqual(parseSentinels('⟦TRACK wf id=xxx⟧'), []);
});

test('wf missing id is dropped', () => {
  assert.deepEqual(parseSentinels('⟦TRACK wf rdc=r1⟧'), []);
});

test('phase missing name is dropped', () => {
  assert.deepEqual(parseSentinels('⟦TRACK phase nth=2⟧'), []);
});

test('wf title defaults to empty string', () => {
  const r = parseSentinels('⟦TRACK wf rdc=r1 id=w1⟧');
  assert.equal(r[0].title, '');
});
