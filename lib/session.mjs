// session.mjs
import { parseSentinels } from './sentinel.mjs';

const DEFAULT_KB = ['kb-consume', 'dev-wiki', 'kb-search'];
const KB_PREFIX = ['codegraph_', 'mcp__codegraph__'];

function isKb(name, kbTools) {
  return kbTools.includes(name) || KB_PREFIX.some((p) => name.startsWith(p));
}

function emptyPhase(rdc, wf, phase, nth, ts) {
  return {
    rdc, wf, phase, nth, title: '', sessionId: '', tStart: ts, tEnd: ts, durationMs: 0,
    status: 'done', gate: null,
    tokens: { input: 0, output: 0, cacheRead: 0, cacheCreate: 0, total: 0 },
    turns: 0, toolCalls: { total: 0, byTool: {} }, subagents: 0,
    kb: { calls: 0, hits: 0, refs: 0 },
    _pendingKb: new Set(),
  };
}

export function buildPhases(events, opts = {}) {
  const kbTools = opts.kbTools || DEFAULT_KB;
  const evs = [...events].sort((a, b) => a.ts - b.ts);
  const phases = [];
  let cur = null;
  let rdc = null;
  let wf = null;
  let title = '';

  const open = (name, nth, ts) => {
    cur = emptyPhase(rdc, wf, name, nth, ts);
    cur.title = title;
    phases.push(cur);
  };
  const ensureUnattributed = (ts) => {
    if (!cur) open('__unattributed__', 0, ts);
  };

  for (const e of evs) {
    const sentinels = e.texts.flatMap((t) => parseSentinels(t));
    for (const s of sentinels) {
      if (s.kind === 'wf') { rdc = s.rdc; wf = s.id; title = s.title || title; }
      else if (s.kind === 'phase') { open(s.name, s.nth, e.ts); }
      else if (s.kind === 'gate') {
        for (let i = phases.length - 1; i >= 0; i--) {
          if (phases[i].phase === s.phase) { phases[i].gate = s.result; break; }
        }
      }
    }
    ensureUnattributed(e.ts);
    if (cur.rdc == null && rdc != null) { cur.rdc = rdc; cur.wf = wf; cur.title = title; }
    cur.sessionId = e.sessionId || cur.sessionId;
    cur.tEnd = e.ts;
    cur.durationMs = cur.tEnd - cur.tStart;

    if (e.role === 'assistant') {
      cur.turns += 1;
      if (e.usage) {
        for (const k of ['input', 'output', 'cacheRead', 'cacheCreate', 'total']) {
          cur.tokens[k] += e.usage[k];
        }
      }
      if (e.isSidechain) cur.subagents += 1;
      for (const tu of e.toolUses) {
        cur.toolCalls.total += 1;
        cur.toolCalls.byTool[tu.name] = (cur.toolCalls.byTool[tu.name] || 0) + 1;
        if (isKb(tu.name, kbTools)) { cur.kb.calls += 1; cur._pendingKb.add(tu.id); }
      }
    }
    for (const tr of e.toolResults) {
      if (cur._pendingKb.has(tr.id)) {
        cur._pendingKb.delete(tr.id);
        if (!tr.isError && tr.len > 0) { cur.kb.hits += 1; cur.kb.refs += 1; }
      }
    }
  }
  return phases.map(({ _pendingKb, ...p }) => p);
}
