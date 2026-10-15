# 00 · 项目概览

## 背景
`articles/` 中的两本 K12 英语时文阅读练习册（扫描 PDF）要变成可交互的数字资源，最终在 **UniRead** 英语阅读产品中上线。学生在 PC 浏览器或 iPad 上阅读文章、作答、提交并查看结果。

## 核心概念
| 术语 | 含义 |
|---|---|
| **Playlist** | 一本书 = 一个 playlist；名称取封面标题，如 `小学英语时文阅读｜提分训练3+X｜3年级` |
| **Item** | 一篇文章 + 对应全部题目；显示名 `Week {n} {Day} {Title}`，如 `Week 1 Monday Tiny “Embryos” Begin Space Test` |
| **Section** | Item 内一个大题（如每周精读的 I / II），有自己的英文指令 |
| **Question** | 一道计分单元，含一个 interaction |
| **Interaction** | 交互类型，命名对齐 QTI 3.0：choice / inlineChoice / gapMatch / textEntry / match / extendedText / order |
| **Blank** | 文章、表格或题干中的空格（`b1`…），由某道题负责作答 |
| **Key** | 答案键（与题目分文件存放，可只部署在服务端） |
| **Attempt** | 一次作答记录（本地存储；格式即 UniRead 上报格式） |

## 页面
1. **Playlists**：playlist 卡片网格
2. **Playlist 详情**：左侧封面与介绍，右侧按周分组的 item 列表（显示作答状态与得分）
3. **阅读理解界面**：左 50% 静态文章（标题 → 信息框 → 图片 → 正文 → Words & Expressions），右 50% 交互题目；全部作答后提交，显示结果与复盘

## 范围（v1）
- 两本书共 150 篇的完整转录、答案与解析
- 8 类题目交互（PC + iPad 触屏）
- 本地进度保存
- 不含：账号体系、后端、音频/视频、全文翻译（预留字段）

## 已确认决策
见 [decisions/](decisions/)：
- ADR-0001 独立 React+Vite 静态站
- ADR-0002 文中空格左栏联动
- ADR-0003 localStorage 作答记录
- ADR-0004 从扫描页裁剪图片
- ADR-0005 数据模型对齐 QTI 3.0、答案与题目分离
- ADR-0006 UI 依据 UniRead 截图（已被 0007 取代）
- ADR-0007 视觉以 Figma 设计系统为准
- ADR-0008 主观题用 LLM as a Judge 评分

## 文档导航
| 文档 | 内容 |
|---|---|
| [01-content-inventory](01-content-inventory.md) | 两本书目录、页码映射、题型与版式盘点 |
| [02-question-types](02-question-types.md) | 题型清单与 PC/iPad 交互规范 |
| [03-data-model](03-data-model.md) | 数据结构 |
| [04-content-pipeline](04-content-pipeline.md) | 转录 → 答案 → 裁图 → 校验 → 复核 |
| [05-ui-spec](05-ui-spec.md) | 页面结构与交互行为（视觉见 Figma 登记表） |
| [06-uniread-integration](06-uniread-integration.md) | 接入 UniRead 的契约 |
| [07-dev-plan](07-dev-plan.md) | 开发执行计划与验收 |
| [09-subjective-scoring](09-subjective-scoring.md) | 主观题 LLM as a Judge：调研、评分规则、提示、接入契约、校准 |
| [design/figma-registry](design/figma-registry.md) | Figma 组件登记与 token 映射 |
