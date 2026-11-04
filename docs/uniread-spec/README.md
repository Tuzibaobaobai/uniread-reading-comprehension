# UniRead 平台规范（接入方下发）

本目录只放 **UniRead 平台接入开发下发给本仓库的规范**，与本项目自己的文档分开，方便平台方单独更新。

| 规范 | 文件 | 来源 | 当前版本 |
| --- | --- | --- | --- |
| RC 接入 i18next（文案配置化，zh-CN / en-US 可切换） | [i18n.md](i18n.md) | [#106](https://github.com/Tuzibaobaobai/uniread-reading-comprehension/issues/106) | 1 · 2026-10-22 |
| 页面加载 Loading 组件 | [loading.md](loading.md) | [#107](https://github.com/Tuzibaobaobai/uniread-reading-comprehension/issues/107) | 1 · 2026-10-22 |
| 内容生产阶段的静态资产与 OSS 上传（RC 预生成 releaseId，沿用 BE key） | [asset-oss.md](asset-oss.md) | [#130](https://github.com/Tuzibaobaobai/uniread-reading-comprehension/issues/130) | 0.2 · 2026-10-27 |
| 设计系统：变量、样式、组件（Figma UniRead） | [design-system/](design-system/README.md) | Figma 设计系统页 19363-120255 | DS-2026-11-03 |

## 约定

- **每份规范一个文件**，开头写来源、维护方、版本和适用范围，末尾是更新记录。正文以平台原文为准，本项目不改写要求；对原文的理解、落实办法和检查命令写在本项目自己的文档里（见下），不写进这些文件。
- **平台更新规范**：在 GitHub 开标题以「[规范同步]」开头的 issue，或直接修改 / 新增本目录的文件。更新时提高版本号，在更新记录加一行；新增规范时在上表加一行。
- **本项目收到更新后**：按新版本检查并修改全部已有内容和代码，包括已交付的内容类型；在对应 issue 回复落实情况。
- **适用于所有内容类型**（资产与 OSS 规范适用于采用生产阶段上传的交付）：时文阅读、KET / PET、词汇天天练，以及今后新增的格式，首次生产和后续更新都要符合。新内容类型交付前按下面的检查跑一遍。

## 本项目的落实位置（不属于规范正文）

| 规范 | 本项目的执行规则 | 自动检查 |
| --- | --- | --- |
| i18n | `CLAUDE.md`「Code」一节；生产规约 [docs/14 §13](../14-agent-production-rules.md#13-uniread-平台规范界面文案与页面加载) | `npm test`（`src/i18n/i18n.test.ts`：两份语言文件 key 集合与插值变量一致；源码中没有硬编码的中文界面文案）；`npm run e2e`（`e2e/i18n.spec.ts`：各内容类型在 en-US 下全部界面为英文） |
| Loading | `.claude/rules/ui-style.md`「页面加载」；`ui-style-kit/SKILL.md`「页面加载：Loading」；docs/14 §13 | `e2e/flow.spec.ts` 等：请求变慢时出现遮罩、数据到达后消失 |
| 资产与 OSS | 生产规约 [docs/14 §14](../14-agent-production-rules.md#14-静态资产与-oss-上传uniread-specasset-oss130版本02)；工具 `scripts/asset-plan.ts`、`scripts/asset-upload.ts`、`scripts/lib/asset-identity.ts` | `npm test`（`scripts/asset.test.ts`：UUIDv5／Go JSON 与独立实现的参考值一致、key 规则、计划可重现、模拟 OSS 上的不可覆盖上传与回读验真） |
| 设计系统 | 生产规约 [docs/14 §15](../14-agent-production-rules.md#15-uniread-设计系统token组件与版本uniread-specdesign-system)；`design-system/`（lock、tokens、组件清单与登记表）；脚本 `scripts/ds-sync.ts`、`ds-build.ts`、`ds-check.ts` | `npm test`（`scripts/ds-check.test.ts`：只用锁定版本中存在的 `--ur-*`；硬编码颜色和遗留字面量只减不增） |
