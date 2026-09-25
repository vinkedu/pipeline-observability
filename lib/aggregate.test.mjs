// aggregate.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aggregate } from './aggregate.mjs';

function ph(o) {
  return {
    rdc: o.rdc, wf: o.wf, phase: o.phase, nth: o.nth || 1, sessionId: o.s || 's1',
    tStart: o.t, tEnd: o.t + (o.d || 0), durationMs: o.d || 0,
    status: 'done', gate: o.gate ?? null, title: o.title || '',
    tokens: { input: 0, output: 0, cacheRead: 0, cacheCreate: 0, total: o.tok || 0 },
    turns: o.turns || 0, toolCalls: { total: o.tc || 0, byTool: {} }, subagents: 0,
    kb: { calls: o.kc || 0, hits: o.kh || 0, refs: 0 },
  };
}

test('groups into rdc -> workflow -> phase, tokens summed', () => {
  const phases = [
    ph({ rdc: 'r1', wf: 'w1', phase: 'A', t: 10, tok: 100, gate: 'PASS' }),
    ph({ rdc: 'r1', wf: 'w1', phase: 'B', t: 20, tok: 50, gate: 'FAIL' }),
    ph({ rdc: 'r1', wf: 'w2', phase: 'A', t: 30, tok: 70, gate: 'PASS' }),
  ];
  const rdcs = aggregate(phases);
  assert.equal(rdcs.length, 1);
  assert.equal(rdcs[0].workflowCount, 2);
  assert.equal(rdcs[0].totals.tokens, 220);
});

test('workflow gatePassRate = pass / (non-null gates)', () => {
  const phases = [
    ph({ rdc: 'r1', wf: 'w1', phase: 'A', t: 10, gate: 'PASS' }),
    ph({ rdc: 'r1', wf: 'w1', phase: 'B', t: 20, gate: 'FAIL' }),
    ph({ rdc: 'r1', wf: 'w1', phase: 'C', t: 30, gate: null }),
  ];
  const wf = aggregate(phases)[0].workflows[0];
  assert.equal(wf.gatePassRate, 0.5);
});

test('gatePassRate null when no gates recorded', () => {
  const phases = [ph({ rdc: 'r1', wf: 'w1', phase: 'A', t: 10, gate: null })];
  assert.equal(aggregate(phases)[0].workflows[0].gatePassRate, null);
});

test('status: last phase with FAIL gate is blocked, earlier are done', () => {
  const phases = [
    ph({ rdc: 'r1', wf: 'w1', phase: 'A', t: 10, gate: 'PASS' }),
    ph({ rdc: 'r1', wf: 'w1', phase: 'B', t: 20, gate: 'FAIL' }),
  ];
  const ps = aggregate(phases)[0].workflows[0].phases;
  assert.equal(ps[0].status, 'done');
  assert.equal(ps[1].status, 'blocked');
});

test('unattributed with null rdc is dropped from tree', () => {
  const phases = [
    { ...ph({ rdc: null, wf: null, phase: '__unattributed__', t: 5, tok: 999 }), nth: 0 },
    ph({ rdc: 'r1', wf: 'w1', phase: 'A', t: 10, tok: 10 }),
  ];
  const rdcs = aggregate(phases);
  assert.equal(rdcs.length, 1);
  assert.equal(rdcs[0].rdc, 'r1');
});

test('placeholder rdc (<slug> / <runId>) is filtered out', () => {
  const phases = [
    ph({ rdc: '<slug>', wf: '<runId>', phase: '<阶段名>', t: 5, tok: 100 }),
    ph({ rdc: 'real-rdc', wf: 'w1', phase: 'A', t: 10, tok: 50 }),
  ];
  const rdcs = aggregate(phases);
  assert.equal(rdcs.length, 1);
  assert.equal(rdcs[0].rdc, 'real-rdc');
});

test('cross-session same runId groups into one workflow', () => {
  const phases = [
    ph({ rdc: 'r1', wf: 'w1', phase: 'A', s: 'sessA', t: 10, tok: 10 }),
    ph({ rdc: 'r1', wf: 'w1', phase: 'B', s: 'sessB', t: 20, tok: 20 }),
  ];
  const rdcs = aggregate(phases);
  assert.equal(rdcs[0].workflowCount, 1);
  assert.equal(rdcs[0].workflows[0].phaseCount, 2);
  assert.equal(rdcs[0].workflows[0].totals.tokens, 30);
});
