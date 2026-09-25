// aggregate.mjs
function blankTotals() {
  return { tokens: 0, durationMs: 0, turns: 0, toolCalls: 0, subagents: 0, kb: { calls: 0, hits: 0, refs: 0 } };
}
function addTotals(t, p) {
  t.tokens += p.tokens.total;
  t.durationMs += p.durationMs;
  t.turns += p.turns;
  t.toolCalls += p.toolCalls.total;
  t.subagents += p.subagents;
  t.kb.calls += p.kb.calls;
  t.kb.hits += p.kb.hits;
  t.kb.refs += p.kb.refs;
}
function passRate(phases) {
  const withGate = phases.filter((p) => p.gate != null);
  if (withGate.length === 0) return null;
  return withGate.filter((p) => p.gate === 'PASS').length / withGate.length;
}

export function aggregate(phases) {
  // 过滤：rdc 为 null，或 rdc/wf/phase 是占位符（含 < > 的字面量示例）
  const isPlaceholder = (s) => s != null && (s.includes('<') || s.includes('>'));
  const keep = phases.filter((p) =>
    !(p.phase === '__unattributed__' && p.rdc == null) &&
    !isPlaceholder(p.rdc) && !isPlaceholder(p.wf)
  );
  const byRdc = new Map();
  for (const p of keep) {
    if (!byRdc.has(p.rdc)) byRdc.set(p.rdc, new Map());
    const wfMap = byRdc.get(p.rdc);
    if (!wfMap.has(p.wf)) wfMap.set(p.wf, []);
    wfMap.get(p.wf).push(p);
  }

  const rdcs = [];
  for (const [rdc, wfMap] of byRdc) {
    const workflows = [];
    for (const [wf, ps] of wfMap) {
      ps.sort((a, b) => a.tStart - b.tStart);
      ps.forEach((p, i) => {
        p.status = (i === ps.length - 1 && p.gate === 'FAIL') ? 'blocked' : 'done';
      });
      const totals = blankTotals();
      ps.forEach((p) => addTotals(totals, p));
      workflows.push({
        wf, rdc, title: (ps.find((p) => p.title)?.title) || '',
        phaseCount: ps.length, gatePassRate: passRate(ps), totals,
        tStart: ps[0].tStart, tEnd: ps[ps.length - 1].tEnd, phases: ps,
      });
    }
    workflows.sort((a, b) => a.tStart - b.tStart);
    const totals = blankTotals();
    const allPhases = workflows.flatMap((w) => w.phases);
    allPhases.forEach((p) => addTotals(totals, p));
    rdcs.push({
      rdc, title: workflows.find((w) => w.title)?.title || rdc,
      workflowCount: workflows.length,
      dateRange: [Math.min(...workflows.map((w) => w.tStart)), Math.max(...workflows.map((w) => w.tEnd))],
      gatePassRate: passRate(allPhases), totals, workflows,
    });
  }
  rdcs.sort((a, b) => b.dateRange[1] - a.dateRange[1]);
  return rdcs;
}
