---
name: pipeline-observability
description: 全流程埋点监控看板。触发词：埋点看板、埋点监控、看研发流程数据、门禁通过率趋势、各阶段耗时/token 分析。把 Claude Code 研发会话（transcript + ⟦TRACK⟧ 哨兵）编译成 RDC→工作流→阶段三层下钻看板。
---

# 全流程埋点监控

把 Claude Code 研发流水线的 transcript + 哨兵标记编译成三层下钻看板（RDC 列表 → 工作流阶段表），让流程优化有据可依。

## 环境（所有命令前置）

```bash
NODE="C:/Users/kaiwen_du/AppData/Local/Volta/tools/image/node/22.23.1/node.exe"
DIR="D:/Projects/.claude/skills/pipeline-observability"
```

禁用 `/d/node.exe`（坏的 v18.17.0）。

## /埋点看板

采集 + 渲染 + 告知用户打开看板：

```bash
"$NODE" "$DIR/collect.mjs"    # 扫 transcript，增量更新账本
"$NODE" "$DIR/render.mjs"     # 账本 → dashboard.html
```

完成后告诉用户打开：`D:/Projects/.claude/workspace-cache/pipeline-observability/dashboard.html`

## /埋点 track

读 `references/sentinel-convention.md` 全文并注入当前会话上下文，之后本会话按约定打 `⟦TRACK⟧` 哨兵行。用于模式 B（按需引入）或临时启用埋点。

## /埋点 mode <always|on-demand>

改 `config.json` 的 `mode` 字段：
- `always`：保留 SessionEnd hook（自动采集）+ CLAUDE.md 里的哨兵约定引用（常驻注入）。
- `on-demand`：移除上述两者（改 `~/.claude/settings.json` / `D:/Projects/CLAUDE.md` 前先备份）。

## 数据说明

- **状态（status）** done/blocked 是结构推断，非硬记录。
- **门禁 —** 表示该阶段未打 gate 哨兵，不代表失败。
- 无哨兵的历史会话归 `__unattributed__`，不进树（只保证不崩，不做阶段推断）。
- 账本 `phases.ndjson` / 产物 `dashboard.html` 落在 `workspace-cache/pipeline-observability/`。
