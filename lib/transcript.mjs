// transcript.mjs
export function parseLine(raw) {
  if (!raw || !raw.trim()) return null;
  let o;
  try { o = JSON.parse(raw); } catch { return null; }
  const t = o.type;
  if (t !== 'assistant' && t !== 'user') return null;
  if (!o.timestamp) return null;
  const ts = Date.parse(o.timestamp);
  if (Number.isNaN(ts)) return null;
  const msg = o.message || {};
  const content = Array.isArray(msg.content) ? msg.content : [];
  const texts = [];
  const toolUses = [];
  const toolResults = [];
  for (const c of content) {
    if (c.type === 'text' && typeof c.text === 'string') texts.push(c.text);
    else if (c.type === 'tool_use') toolUses.push({ id: c.id, name: c.name });
    else if (c.type === 'tool_result') {
      const body = typeof c.content === 'string'
        ? c.content
        : JSON.stringify(c.content ?? '');
      toolResults.push({ id: c.tool_use_id, isError: !!c.is_error, len: body.length });
    }
  }
  let usage = null;
  if (t === 'assistant' && msg.usage) {
    const u = msg.usage;
    const input = u.input_tokens || 0;
    const output = u.output_tokens || 0;
    const cacheRead = u.cache_read_input_tokens || 0;
    const cacheCreate = u.cache_creation_input_tokens || 0;
    usage = { input, output, cacheRead, cacheCreate, total: input + output + cacheRead + cacheCreate };
  }
  return {
    ts, sessionId: o.sessionId || '', role: t,
    isSidechain: !!o.isSidechain, usage, texts, toolUses, toolResults,
  };
}
