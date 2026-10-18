# 01 · 内容盘点（Content Inventory）

7 本均为《Current Insights 时文阅读｜提分训练3+X》（上海学生英文报 编，华东理工大学出版社），扫描版 PDF（带 OCR 文字层），各配一册答案（另册）。PDF 放在 `articles/`（不入库）；页码映射、周起始页、答案册页码集中在 `scripts/book-maps.mjs`。

| 合集 | 书 | 篇数 | 页码换算 | 讲解视频标记 | 版次 |
|---|---|---|---|---|---|
| ci-g3 | 小学 3 年级 | 60（12 周） | 书页 N = PDF p(N+9) | 每周精读（前言） | 2026.6 第 1 版 |
| ci-g4 | 小学 4 年级 | 60（12 周） | 同上 | 每周精读（前言） | 2026.6 第 1 版 |
| ci-g5 | 小学 5 年级 | 60（12 周） | 同上 | 每周精读（前言） | 2026.6 第 1 版 |
| ci-xsc3 | 小升初 第 3 辑 | 90（18 周） | 同上 | 文章页标记 | 2026.5 第 1 版 |
| ci-g7 | 初一 7 年级 第 3 辑 | 90（18 周） | 同上 | 文章页标记 | 2026.5 第 1 版 |
| ci-g8 | 初二 8 年级 第 3 辑 | 90（18 周） | 同上 | 文章页标记 | 2026.5 第 1 版 |
| ci-zk | 中考 第 3 辑 | 90（18 周） | 同上 | 文章页标记 | 2026.5 第 1 版 |

> 旧版小升初（`ssp时文 小升初.pdf`，合集 `ci-xsc`，书页 N = PDF p(N+8)）已于 2026-10-18 移除，其 ID 退役不再复用。下文“每周结构”中的初中列以它为样本，各辑结构相同。

## 每周结构

| 日 | 小学（样本：3年级） | 初中各辑（样本：旧版小升初） |
|---|---|---|
| Mon / Tue | 阅读选择：3 选项 MCQ × 3–4 | 阅读理解：4 选项 MCQ × 5（偶有 3 选项、①–④ 组合题、词义/指代题、计算题；材料可为广告、时刻表、预订单、便条、对话） |
| Wed | 完形填空：文中 5–6 空，A–C | 完形填空：文中 10 空，A–D，书中无指令行 |
| Thu | 选词填空(A–H 选 6) / 六选四(句子 A–F 选 4) / 连线(5 对) / 判断正误(5) / 回答问题(5) | 回答问题(猜词义 I + 回答问题 II，末题为观点题) / 选词填空(A–K 选 10) / 短文填空(含词形变换、首字母) / 七选五 / 表格填空(首字母提示) / 补全对话(7 选 5) |
| Fri 每周精读 | I/II 两节任意组合：判断、单选、选词(句中空，一题可两空)、回答问题、连线 | I/II 组合：判断、句子补全、回答问题、单选、括号二选一、连线；均配视频讲解 |

## 版式元素（左栏需呈现）
- 标题：首词大号黑色 + 其余彩色；Monday… 日标签；WEEK n 侧标
- 信息框：语篇类型、词数、难度、建议用时、主题语境、内容要求（小升初合并为“主题语境（内容要求）”）、导语/导读
- 正文：彩色高亮词（= W&E 词条，可为短语）、下划线考查词、行内中文括注 `word ( 中文 )`、斜体书名、引语
- 结构：段落、小标题、项目符号/编号列表、对话（说话人图例）、便条（署名/时间）、广告表格、时刻表+票价、预订表单、数据表格、“Did you know?” 侧栏、Notes 脚注
- 图片：0–3 张黑白照片/插画，彩色边框
- Words & Expressions：`★ word /IPA/ pos. 中文`，2–9 条，短语无音标

## 目录 · ci-g3（3年级）
书页 → PDF 页 +9。题型：选=阅读选择，完=完形填空，词=选词填空，六=六选四，连=连线题，判=判断正误，答=回答问题，精=每周精读

| W | Mon（选） | Tue（选） | Wed（完） | Thu | Fri（精） |
|---|---|---|---|---|---|
| 1 | Tiny “Embryos” Begin Space Test · 1 | Kids Find Maths and Magic in Flowers · 2 | Pets Are Part of the Family! · 4 | 词 Little Beads, Big Fun · 5 | Going GREEN · 6 |
| 2 | Court Says AI Mistakes Are Not Always Illegal · 8 | Zhang Xue: From a Bike-Loving Boy to a World Champion · 10 | New Helpers at Hospitals · 11 | 六 Shakira Sings New World Cup Song · 12 | The Elephant House: The Birthplace of *Harry Potter* · 13 |
| 3 | A City Where Street Trees Grow Lychees · 14 | Yellowstone National Park · 16 | Fish Do Sleep · 18 | 连 Please Come Out, Groundhog! · 19 | Working at Port Lockroy · 20 |
| 4 | The Teen Who Counts Super Fast · 22 | French Fry Lip Balm · 24 | Shadow Puppet Show · 26 | 判 Playing With Buildings · 27 | Children’s Day Around the World · 28 |
| 5 | Animals Make Art · 30 | Girls Want to Wear Trousers · 32 | My Family Story · 34 | 答 The Gerbil Museum · 35 | Wheeling Round the World · 36 |
| 6 | The Secret to a Perfect Bowling Strike · 38 | Zero-Carbon Service Area · 40 | Holi Celebration · 41 | 判 How and When to Wash Your Hands · 42 | Tennis Game-Set-Match · 44 |
| 7 | Post Boxes Go Solar! · 46 | The Giant Chocolate Egg · 48 | Tracing Bees · 50 | 词 A Stylish Dog · 51 | Meet Chef Lenny · 52 |
| 8 | Dog Waits Outside Hospital · 54 | New Year’s Celebrations in Central and South America · 55 | Should Kids Use Skincare? · 56 | 六 Museum Blind Boxes · 57 | What Is Cosplay? · 58 |
| 9 | Riley’s Five Emotions · 60 | The Chocolate Capital of the World · 62 | Ways to Feel Calm · 64 | 答 Peter Rabbit · 65 | What CAN You Give? · 66 |
| 10 | Mipig: A Piglet Cafe in Tokyo · 68 | Little World, Big Fun · 70 | Sunlight-Warming Fabric · 72 | 连 Getting to Know Happiness · 73 | Wild Weather · 74 |
| 11 | Dr Dan the Pancake Man · 76 | Paella: Rice Dish From Spain · 77 | Smelling Mummies · 78 | 判 Fire Safety for Kids · 79 | Making Maths Fun with Colours · 80 |
| 12 | The Young Mountain Climber · 82 | Karla Cares for Zoo Animals · 84 | Art Auction for a Park · 85 | 六 The Real Stars in Houtong Are Cats · 86 | New Ravens at the Tower of London · 87 |

## 已知原书问题
- 原书和官方答案的疑似错误按原书照录，逐条提 GitHub issue（标签 `errata`），人工在 issue 中确认后再改
- 原书缺“建议用时”的篇目按年级阅读速度加做题时间估算，方法记在 item 的 `errata`（见 docs/production-brief.md）
- 处理方式见 [04-content-pipeline.md §5](04-content-pipeline.md)
