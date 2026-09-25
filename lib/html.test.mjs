// html.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderHtml, esc, fmtDur, fmtTok } from './html.mjs';

test('esc escapes html special chars', () => {
  assert.equal(esc('<b>&"x'), '&lt;b&gt;&amp;&quot;x');
});

test('fmtDur / fmtTok formatting', () => {
  assert.equal(fmtDur(3 * 3600e3 + 42 * 60e3), '3h 42min');
  assert.equal(fmtDur(5 * 60e3), '5min');
  assert.equal(fmtTok(382000), '382K');
  assert.equal(fmtTok(900), '900');
});

test('renderHtml: self-contained, escapes title, shows rdc', () => {
  const rdcs = [{
    rdc: 'r1', title: '<script>x</script>', workflowCount: 1,
    dateRange: [1000, 2000], gatePassRate: 1,
    totals: { tokens: 382000, durationMs: 3600e3, turns: 8, toolCalls: 12, subagents: 1, kb: { calls: 3, hits: 2, refs: 2 } },
    workflows: [{
      wf: 'w1', rdc: 'r1', title: 't', phaseCount: 1, gatePassRate: 1,
      tStart: 1000, tEnd: 2000,
      totals: { tokens: 382000, durationMs: 3600e3, turns: 8, toolCalls: 12, subagents: 1, kb: { calls: 3, hits: 2, refs: 2 } },
      phases: [{ rdc: 'r1', wf: 'w1', phase: '方案设计', nth: 1, status: 'done', gate: 'PASS',
        durationMs: 3600e3, turns: 8, tokens: { total: 382000 }, toolCalls: { total: 12, byTool: {} }, subagents: 1, kb: { calls: 3, hits: 2, refs: 2 } }],
    }],
  }];
  const html = renderHtml(rdcs);
  assert.equal(html.startsWith('<!DOCTYPE html>'), true);
  assert.equal(html.includes('<script>x</script>'), false);
  assert.equal(html.includes('&lt;script&gt;'), true);
  assert.equal(html.includes('r1'), true);
  assert.equal(html.includes('方案设计'), true);
});

test('renderHtml: empty rdcs still valid html', () => {
  const html = renderHtml([]);
  assert.equal(html.startsWith('<!DOCTYPE html>'), true);
  assert.equal(html.includes('</html>'), true);
});
