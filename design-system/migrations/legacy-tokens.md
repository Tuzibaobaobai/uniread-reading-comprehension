# 遗留 token 缺口（DS-2026-11-03 → 2026-11-04 处理后）

`src/styles/tokens.css` 原有 159 个旧名，已全部指向 `--ur-*`，只剩下面 47 个值。由 `scripts/ds-check.ts` 计数，只减不增。

## 已按决定改用 UniRead（2026-11-04）

- **字体：** 全部改用 Noto Sans SC（`font/primary-font-family`），自托管于 `src/assets/fonts/Noto_Sans_SC/`。
  - 这个字体中，英文弯引号和撇号默认是全宽的。英文内容区域已用字体的半宽替代字形（`halt`）修正，撇号仍略宽。**请设计师在 Figma 中确认英文内容的引号显示。**
- **圆角：** `--radius-l` 改为 `radius/l`（30px）。8px 和 12px 的圆角统一为 `radius/xs`（10px）。
- **行高：** `--lh-s` 改为 `Font system/S` 的 24px。15px、13px 字号归入 S（14）、XS（12）。
- **主色浅 / 深：** 改为 `color/brand/2`、`color/brand/7`（通过提案的 `color/action/primary-soft` / `primary-strong`）。
- **阴影：**
  - 卡片：`card`、`card-hover`、`drop-shadow/card lg`。
  - 按钮：`drop-shadow/btn-xs`、`drop-shadow/btn`。
  - 底栏：`bar`。
  - 对话框：`drop-shadow/dropdown`。
  - 提示：`drop-shadow/chart tip`。

## 已映射到提案 token（`design-system/tokens/rc-proposed.tokens.json`，待批准）

- **语义颜色：** `color/text/*`、`color/background/*`、`color/border/*`、`color/action/*`、`color/feedback/*`、`color/overlay/backdrop`，全部是 UniRead 现有原始值或填充样式的别名。
  - 学生作答文字 → `Primary Blue/Cyan`。
  - 原文高亮、定位闪烁 → `Chart/1-3`、`Chart/2-3`。
  - 标记题目 → `State/hint-light`。
  - 轨道 → `Grey/4`。
  - 深色图标 → `Grey/14`。
- **间距：** `space/2 … space/80`（4/8 基数）。控件高度用 UniRead 已有的 `height/height-*`（8px 步进）。
- **尺寸：** `size/touch-target`（44px，WCAG / Apple HIG）、`size/icon/s|m|l|xl`。

## 需要设计师处理

### 颜色（无对应语义或不满足对比度）

| token | 值 | 说明 |
| --- | --- | --- |
| `--success-text` | `#497249` | 成功背景上的解析文字 #497249。UniRead 的 State/finished-dark #6DA882 在 success-bg 上对比度约 2.6:1，达不到 4.5:1 |
| `--success-divider` | `rgba(73, 114, 73, 0.2)` | 同上的 20% 分隔线 |
| `--pair-1` | `#f07b3f` | 连线题配对标记需要 7 种可区分的颜色；UniRead 只有 3 个色系的 Chart 色阶 |
| `--pair-2` | `#3e8ef7` | 连线题配对标记需要 7 种可区分的颜色；UniRead 只有 3 个色系的 Chart 色阶 |
| `--pair-3` | `#2fa36b` | 连线题配对标记需要 7 种可区分的颜色；UniRead 只有 3 个色系的 Chart 色阶 |
| `--pair-4` | `#a65ce8` | 连线题配对标记需要 7 种可区分的颜色；UniRead 只有 3 个色系的 Chart 色阶 |
| `--pair-5` | `#e5a400` | 连线题配对标记需要 7 种可区分的颜色；UniRead 只有 3 个色系的 Chart 色阶 |
| `--pair-6` | `#e5484d` | 连线题配对标记需要 7 种可区分的颜色；UniRead 只有 3 个色系的 Chart 色阶 |
| `--pair-7` | `#17a2b8` | 连线题配对标记需要 7 种可区分的颜色；UniRead 只有 3 个色系的 Chart 色阶 |

### 字号（超出 Font system 4XL 24px）

| token | 值 | 说明 |
| --- | --- | --- |
| `--fs-5xl` | `32px` | 32/44，成绩大数字 |
| `--lh-5xl` | `44px` |  |
| `--fs-display` | `48px` | 48px，结果页大字 |

### 透明度与模糊

| token | 值 | 说明 |
| --- | --- | --- |
| `--disabled-opacity` | `0.2` | 禁用态 20% 不透明度；UniRead 组件各自定义禁用态 |
| `--blur-panel` | `100px` | 合集信息面板 100px 背景模糊；UniRead blur/glass 只有 10px |

### 描边 / 细线宽度（UniRead 没有 stroke 变量）

| token | 值 | 说明 |
| --- | --- | --- |
| `--radio-border` | `0.75px` | 单选圈 0.75px |
| `--blank-line` | `1.5px` | 填空下划线 1.5px |
| `--progress-h` | `2px` | 进度条 2px |
| `--criteria-bar-h` | `6px` | 评分维度条 6px |

### 组件尺寸（随组件进入阶段 3 提案，在组件定义中确认）

这些是单个组件的专用尺寸，不适合作为全局 token。阶段 5 移入各组件的 CSS，作为组件级变量，并在 Figma 提案组件中标注。

| token | 值 |
| --- | --- |
| `--option-image-max-h` | `160px` |
| `--back-icon` | `18px` |
| `--radio-dot` | `15px` |
| `--option-pad-y` | `19px` |
| `--pager-btn-w` | `200px` |
| `--pager-mark-w` | `20px` |
| `--row-thumb-w` | `256px` |
| `--blank-min-w` | `3em` |
| `--player-btn-w` | `128px` |
| `--player-icon` | `44px` |
| `--player-time-w` | `52px` |
| `--tip-max-w` | `320px` |
| `--tip-max-h` | `240px` |
| `--record-dot` | `12px` |
| `--speak-btn-icon` | `64px` |
| `--solo-max-w` | `960px` |
| `--portrait-w` | `112px` |
| `--portrait-row-w` | `64px` |
