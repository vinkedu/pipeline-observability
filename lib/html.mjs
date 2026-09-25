// html.mjs
export function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
export function fmtDur(ms) {
  const min = Math.round(ms / 60000);
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}
export function fmtTok(n) {
  return n >= 1000 ? `${Math.round(n / 1000)}K` : String(n);
}
function rate(r) { return r == null ? '—' : `${Math.round(r * 100)}%`; }
function rateClass(r) { return r == null ? 'gray' : (r >= 1 ? 'green' : 'red'); }

function phaseRow(p) {
  const bad = (p.status === 'blocked' || p.gate === 'FAIL') ? ' class="bad"' : '';
  const kb = p.kb.calls ? `${p.kb.hits}/${p.kb.calls}` : '—';
  const phaseName = p.phase === '__unattributed__' ? '（未标记阶段）' : p.phase;
  return `<tr${bad}><td style="color:${p.phase==='__unattributed__'?'#9ca3af':'inherit'}">${esc(phaseName)}${p.nth > 1 ? ` 第${p.nth}次` : ''}</td>`
    + `<td>${esc(p.status)}</td><td>${esc(p.gate ?? '—')}</td>`
    + `<td>${fmtTok(p.tokens.total)}</td><td>${p.toolCalls.total}</td>`
    + `<td>${fmtDur(p.durationMs)}</td><td>${p.turns}</td><td>${kb}</td></tr>`;
}
function wfBlock(w) {
  const rows = w.phases.map(phaseRow).join('');
  return `<details class="wf"><summary>工作流 ${esc(w.wf)} · ${w.phaseCount}阶段 · 门禁 <span class="${rateClass(w.gatePassRate)}">${rate(w.gatePassRate)}</span> · ${fmtTok(w.totals.tokens)} · ${fmtDur(w.totals.durationMs)}</summary>`
    + `<table><thead><tr><th>阶段</th><th>状态*</th><th>门禁</th><th>Token</th><th>工具</th><th>耗时</th><th>轮数</th><th>KB命中</th></tr></thead><tbody>${rows}</tbody></table></details>`;
}
function rdcCard(r) {
  const wfs = r.workflows.map(wfBlock).join('');
  return `<details class="rdc"><summary><b>${esc(r.rdc)}</b> ${esc(r.title)} · ${r.workflowCount}工作流 · 门禁 <span class="${rateClass(r.gatePassRate)}">${rate(r.gatePassRate)}</span> · ${fmtTok(r.totals.tokens)} · ${fmtDur(r.totals.durationMs)}</summary>${wfs}</details>`;
}

export function renderHtml(rdcs) {
  const cards = rdcs.map(rdcCard).join('\n');
  return `<!DOCTYPE html>
<html lang="zh"><head><meta charset="utf-8"><title>全流程埋点监控</title>
<style>
body{font-family:system-ui,'Microsoft YaHei',sans-serif;margin:24px;color:#222}
h1{font-size:20px} .rdc{border:1px solid #ddd;border-radius:8px;margin:8px 0;padding:8px}
.wf{margin:6px 0 6px 16px} summary{cursor:pointer;padding:4px}
table{border-collapse:collapse;margin:6px 0;width:100%} th,td{border:1px solid #eee;padding:4px 8px;font-size:13px;text-align:left}
th{background:#fafafa} .green{color:#0a0;font-weight:bold} .red{color:#d00;font-weight:bold} .gray{color:#999}
tr.bad{background:#fff3f3} .note{color:#999;font-size:12px}
</style></head><body>
<h1>全流程埋点监控</h1>
<p class="note">* 状态为结构推断（done/blocked），非硬记录。门禁 — 表示未记录，不代表失败。</p>
${cards || '<p>暂无数据，先跑 collect.mjs。</p>'}
</body></html>`;
}
