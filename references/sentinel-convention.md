# 埋点哨兵约定

跑 SDD 研发流水线时，在文本回复里打这三种哨兵行（采集器事后扫）：

- 工作流开始（一次）：`⟦TRACK wf rdc=<spec/plan的topic-slug> id=<8位随机串> title="需求标题"⟧`
- 每阶段进入：`⟦TRACK phase name=<阶段名> nth=<第几次>⟧`（首次可省 nth）
- 每门禁结论：`⟦TRACK gate phase=<阶段名> result=PASS|FAIL|PARTIAL⟧`

阶段名固定枚举：需求澄清 / 方案设计 / 计划拆解 / TDD实现 / 门禁检查
回退重进某阶段时 nth+1（如「方案设计 第2次」→ nth=2）。
工作流结束不用打。rdc 用当次 spec/plan 的 topic-slug（如 2026-09-24-xxx）。
