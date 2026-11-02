# UniRead 平台规范（接入方下发）

本目录只放 **UniRead 平台接入开发下发给本仓库的规范**，与本项目自己的文档分开，方便平台方单独更新。

| 规范 | 文件 | 来源 | 当前版本 |
| --- | --- | --- | --- |
| RC 接入 i18next（文案配置化，zh-CN / en-US 可切换） | [i18n.md](i18n.md) | [#106](https://github.com/Tuzibaobaobai/uniread-reading-comprehension/issues/106) | 1 · 2026-10-22 |
| 页面加载 Loading 组件 | [loading.md](loading.md) | [#107](https://github.com/Tuzibaobaobai/uniread-reading-comprehension/issues/107) | 1 · 2026-10-22 |

## 约定

- **每份规范一个文件**，开头写来源、维护方、版本和适用范围，末尾是更新记录。正文以平台原文为准，本项目不改写要求；对原文的理解、落实办法和检查命令写在本项目自己的文档里（见下），不写进这些文件。
- **平台更新规范**：在 GitHub 开标题以「[规范同步]」开头的 issue，或直接修改 / 新增本目录的文件。更新时提高版本号，在更新记录加一行；新增规范时在上表加一行。
- **本项目收到更新后**：按新版本检查并修改全部已有内容和代码，包括已交付的内容类型；在对应 issue 回复落实情况。
- **适用于所有内容类型**：时文阅读、KET / PET、词汇天天练，以及今后新增的格式，首次生产和后续更新都要符合。新内容类型交付前按下面的检查跑一遍。

## 本项目的落实位置（不属于规范正文）

| 规范 | 本项目的执行规则 | 自动检查 |
| --- | --- | --- |
| i18n | `CLAUDE.md`「Code」一节；生产规约 [docs/14 §13](../14-agent-production-rules.md#13-uniread-平台规范界面文案与页面加载) | `npm test`（`src/i18n/i18n.test.ts`：两份语言文件 key 集合与插值变量一致；源码中没有硬编码的中文界面文案）；`npm run e2e`（`e2e/i18n.spec.ts`：各内容类型在 en-US 下全部界面为英文） |
| Loading | `.claude/rules/ui-style.md`「页面加载」；`ui-style-kit/SKILL.md`「页面加载：Loading」；docs/14 §13 | `e2e/flow.spec.ts` 等：请求变慢时出现遮罩、数据到达后消失 |
