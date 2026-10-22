---
name: ui-style-kit
description: 界面样式的参考实现，包括 1000px vw 封顶、全屏壳、默认字体与字号、区域禁止选中，以及 OverflowTip / FittyText / Loading。由目标仓库的常驻说明指向。缺少 PostCSS、视口、全屏壳、forbidden-select、这两个文字组件或 Loading 时读取。项目已声明字体或字号时不要覆盖。不要凭记忆重写测量逻辑。
disable-model-invocation: true
---

# 界面样式约定

本目录是界面样式的参考实现，放在目标仓库根目录，路径保持为 `ui-style-kit/`。内容包括 1000px vw 缩放、全屏壳、超宽文字、默认字体与字号、区域禁止选中。它本身不会自动生效。按对方使用的工具再挂一份常驻说明，正文已写好，不要改写成「等用户提到再用」。三份正文一致，改约定时一起改。

| 工具        | 复制                                                                                 | 何时进入上下文                                                                        |
| ----------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Cursor      | [rules/ui-style.mdc](rules/ui-style.mdc) → `.cursor/rules/ui-style.mdc`              | 每次对话。`alwaysApply: true`                                                         |
| Claude Code | [claude/ui-style.md](claude/ui-style.md) → `.claude/rules/ui-style.md`               | 每次会话启动。文件里不要加 `paths`，加了就变成打开匹配文件才加载                      |
| Codex       | [codex/AGENTS.section.md](codex/AGENTS.section.md) 追加到仓库根目录 `AGENTS.md` 末尾 | 每次新会话。已有 `AGENTS.md` 时只追加，不要覆盖。没有则把该文件存成根目录 `AGENTS.md` |

常驻说明里已经要求：缺 PostCSS、视口、全屏壳、默认字体、`forbidden-select` 或两个文字组件时，来读本文件并按下面的步骤原样接入。字体和字号在项目已有声明时不要覆盖。

设计稿宽度固定为 **1000px**。整页在小于 1000px 时等比缩小，到 1000px 封顶。超宽文字只有两种处理，不要混用。

## 接入步骤

1. 安装依赖：`postcss-mobile-forever@^5`、`@floating-ui/react@^0.27`、`ahooks@^3`、`classnames@^2`。目标项目需支持 CSS Modules（`.module.scss` 或改名为 `.module.css`，组件样式没有 SASS 嵌套）。
2. 把 [postcss.config.js](postcss.config.js) 里的 `postcss-mobile-forever` 合并进目标项目已有的 PostCSS 配置。已有其它插件时保留它们，只追加这一项。
3. 把 [viewport.meta.html](viewport.meta.html) 的 viewport 写入 `index.html` 的 `<head>`，替换旧的 viewport。
4. 接入项目没有另行声明字体时，把 [fonts/](fonts) 按相同子目录复制到 `public/font/`（含许可文件）。`global-shell.css` 里的 `@font-face` 使用 `/font/...`。项目已有自己的字体声明时跳过，不要覆盖。
5. 把 [global-shell.css](global-shell.css) 合并进全局样式（如 `App.scss` / `index.css`）。接到现有 `body` / `#root` 上，不要另起一套根节点，也不要覆盖业务样式。`data-native-immersive` 只在目标项目有原生沉浸式全屏时保留。
6. 把 [sass/forbidden.scss](sass/forbidden.scss) 复制到目标项目 `src/sass/forbidden.scss`。
7. 把 `components/OverflowTip/`、`components/FittyText/`、`components/Loading/` 原样复制到目标项目的组件目录（建议 `src/components/`）。不要改测量、二分和弹出条件。项目已使用 antd 时，Loading 用 `Loading.antd.tsx` 并删掉 `index.tsx` 里的 CSS 转圈。
8. 按下面的选型使用。业务样式继续写 `px`，构建时转成 `vw`。

## 主策略

| 视口       | 行为                                                        |
| ---------- | ----------------------------------------------------------- |
| `< 1000px` | `px` 按 `viewportWidth: 1000` 转成 `vw`，整页含字号等比缩小 |
| `≥ 1000px` | `maxDisplayWidth: 1000` 封顶，保持设计稿 px，不再放大       |

必须保持的插件项：

- `propList: ['*']`：字号也缩放。不要排除 `font-size`。
- `selectorBlackList: [/no-vw/, '.hairlines']`：某条规则不想缩放时，给选择器加上 `no-vw`。
- `exclude: [/node_modules/]`。
- `appContainingBlock: 'manual'`：与 `body { position: fixed }` 搭配，避免插件改写 `fixed` 定位。
- `unitPrecision: 3`。

`postcss-mobile-forever` 默认不转换 `@media` 里的 px。写 `@media (max-width: 1200px)` 时，断点仍是设备像素，不要改成 vw。需要时可以用断点重排整页。

## 视口和全屏壳

- viewport：`width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover`。禁止用户缩放，并让安全区延伸到刘海。
- `body` 用 `position: fixed; inset: 0` 铺满屏幕。不要用 `100vh` 做全屏高度，移动端地址栏会造成高度跳动。
- `#root` 用 `width/height: 100%`、`overflow: hidden`，并用 `env(safe-area-inset-*)` 避开刘海、状态栏和底部手势条。
- `#root` 设置 `-webkit-text-size-adjust: none` 和 `-webkit-tap-highlight-color: transparent`，避免系统改字号和点击高亮。
- 原生沉浸式（可选）：`body[data-native-immersive='true']` 时背景改为黑色，并清掉 `#root` 的上下安全区内边距。

页面内部滚动放在子容器上（`flex: 1; min-height: 0; overflow: auto`），不要让 `body` 自己滚。

## 超宽文字：先选型再套组件

同一段文字只用其中一个。

| 场景                                         | 组件          | 可见结果                                                                                |
| -------------------------------------------- | ------------- | --------------------------------------------------------------------------------------- |
| 卡片标题、列表名可以省略，需要时再看全文     | `OverflowTip` | 字号不变。调用方自己做单行或多行截断。仅在确实溢出时：桌面悬停、触控长按 450ms 弹出全文 |
| 标题、菜单、按钮文案必须在固定盒子里完整可见 | `FittyText`   | 不省略。在 CSS 字号到 1px 之间取最大能放下的字号。短文案保持 CSS 字号                   |

`OverflowTip` 不负责缩小，也不负责写出省略号。调用方样式必须让元素发生溢出（常见是 `overflow: hidden; text-overflow: ellipsis; white-space: nowrap`，多行则用 `line-clamp`）。未溢出不弹出。

`FittyText` 是单行（`white-space: nowrap`）。父级必须用 `width` 或 flex 约束宽度，否则无法测量。高度缩小只在父级用 `height` / `max-height` / flex 限制了高度时生效。容器尺寸或文案变化时会重新计算。

### OverflowTip

```tsx
<OverflowTip className={styles.title}>{name}</OverflowTip>
```

```scss
.title {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

- `content`：弹层全文。不传则用子节点的 `textContent`。
- `disabled`：不检测、不弹出。
- 弹层挂到 `document.body`（FloatingPortal），避免被卡片 `overflow: hidden` 裁切。
- 触控长按成功后会吞掉随后的 click，避免长按看全文时误进卡片。
- 精细指针（`(hover: hover) and (pointer: fine)`）走悬停；否则走长按。外接鼠标时会跟着切换。

### FittyText

```tsx
<FittyText className={styles.title}>{label}</FittyText>
```

```scss
.title {
  font-size: 16px; /* 缩放上限，短文案保持这个字号 */
  font-weight: 600;
}
```

字号相关属性写在 `className` 上，作为上限。组件用二分查找写入内联 `font-size`。最小字号 1px，没有业务下限。

## 页面加载：Loading

与父应用（UniRead）的 Loading 表现一致：`position: fixed` 全屏遮罩，`rgba(255, 255, 255, 0.4)`，`z-index: 1000`，拦截点击；居中是 antd `<Spin size="large" />` 的样子（32px 方框四个圆点、45° 起始 1.2s 匀速旋转、各点 1s 明暗交替）。

```tsx
import Loading from '@/components/Loading';

{!data && !error && <Loading />}
```

- `index.tsx` 不依赖 antd，用 CSS 还原 Spin；颜色取 `--loading-color`，没有则取 `--accent`。已使用 antd 的项目直接用 `Loading.antd.tsx`（附件原版）。
- `active={false}` 时不渲染。父应用里它跟随 KeepAlive 是否可见（`useKeepAliveActive()`），有 KeepAlive 的项目把该值传进来。
- 只用于“整页数据还没回来”。按钮里的小状态（如录音识别中）继续用设计稿图标，不要换成遮罩。
- `prefers-reduced-motion: reduce` 下停止旋转，保留圆点明暗变化。

## 样式写法

与三份常驻说明中的「样式写法」相同。写组件时遵守，不要只在做响应式时才用。

- **字体和字号（默认，不强制）**：接入项目没有另行声明时，字号用 12 / 14 / 16 / 18 / 20 / 22 / 24，字重用 400、500、600、700，正文为 `var(--font-primary-font-family)`，并按档位写 `font-size` 与 `font-weight`（仍由 PostCSS 转成 vw）。项目已有自己的字体、字号档位或 mixin 时，以项目声明为准，不要改成这套，也不要为了对齐档位去改已有字号。
- **动画**：两个及以上组件共用的关键帧放到 `src/sass/`，组件里 `@use`。动画需包一层 `@media (prefers-reduced-motion: reduce)`，在系统要求减少动效时关掉。
- **悬停**：颜色、下划线等只给鼠标的反馈，写在 `@media (hover: hover) and (pointer: fine)` 内，避免触控设备粘住 hover。
- **禁止选中**：某个区域需要禁止选中时，不要手写 `user-select`。把 [sass/forbidden.scss](sass/forbidden.scss) 复制到 `src/sass/forbidden.scss`，只在该区域引入 `forbidden-select`。不要加在 `body` / `#root` 上。输入框、文本域不要放进这个区域，mixin 里对表单的保留是注释掉的。

```scss
@use '@/sass/forbidden' as forbidden;

.reading {
  @include forbidden.forbidden-select;
}
```

- **全局根样式**：按 [global-shell.css](global-shell.css) 合并到全局入口，对应本仓库 `src/App.scss` 的根节点约定。没有另行声明字体时，`:root` 定义 `--font-primary-font-family: 'Noto Sans SC', 'PingFang SC', sans-serif`，正文字体自托管，`@font-face` 使用 `font-display: swap`，Noto 用可变字重覆盖 400–700，展示用字体同样自托管；`#root` 使用该字体，`font-style: normal`，默认 `font-weight: 500`。项目已声明自己的字体时，保留该声明，不必复制 `fonts/`，`#root` 沿用项目的字体和默认字重。两种情况都保留 `font-synthesis: none`、`text-rendering: optimizeLegibility` 与抗锯齿。`body` 默认白底。根节点不禁止文字选中。

## 文件

| 文件                                                        | 用途                             |
| ----------------------------------------------------------- | -------------------------------- |
| [postcss.config.js](postcss.config.js)                      | 合并进目标 PostCSS               |
| [viewport.meta.html](viewport.meta.html)                    | 写入 `index.html`                |
| [global-shell.css](global-shell.css)                        | 合并进全局样式                   |
| [fonts/](fonts)                                             | 复制到 `public/font/`            |
| [sass/forbidden.scss](sass/forbidden.scss)                  | 复制到 `src/sass/`，区域禁止选中 |
| [components/OverflowTip/](components/OverflowTip/index.tsx) | 截断后展示全文                   |
| [components/FittyText/](components/FittyText/index.tsx)     | 缩小字号以完整展示               |
| [components/Loading/](components/Loading/index.tsx)         | 页面级加载遮罩（与父应用一致）   |
