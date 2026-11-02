# UniRead 规范 · 页面加载 Loading 组件

| 项 | 值 |
| --- | --- |
| 规范编号 | `uniread-spec/loading` |
| 来源 | UniRead 平台接入开发 ForestLizard，GitHub [#107](https://github.com/Tuzibaobaobai/uniread-reading-comprehension/issues/107)「[规范同步]Loading组件规范加入ui-style-kit」，2026-10-22，附件 `Loading.zip` |
| 维护方 | UniRead 平台接入开发（本文件以平台下发原文和附件为准，本项目不改写其要求） |
| 版本 | 1（2026-10-22，#107 原文 + 附件） |
| 适用范围 | 本仓库全部页面，包括今后新增的内容类型 |

## 原文

> 当页面需要使用Loading时，如无特殊需求，采用附件里的Loading组件，使之和父应用表现一致，并把它写到ui-style-kit里，并按此修改当前项目的所有实现

## 附件组件（原样保存在 `ui-style-kit/components/Loading/Loading.antd.tsx`）

附件是父应用正在使用的组件，它定义了 Loading 应有的表现：

```tsx
// 附件原版（父应用的 useKeepAliveActive() 在 ui-style-kit 中改为 active 参数）
const Loading: React.FC<{ active?: boolean }> = ({ active = true }) => {
  if (!active) return null;
  return createPortal(
    <div className={styles.loadingMask} aria-busy='true' aria-live='polite'>
      <Spin size='large' spinning />
    </div>,
    document.body
  );
};
```

由附件得出的可观察要求：

1. 整页数据未就绪时显示：挂到 `document.body` 的 `position: fixed` 全屏遮罩，背景 `rgba(255, 255, 255, 0.4)`，`z-index: 1000`，遮罩拦截点击。
2. 遮罩居中是 antd `<Spin size="large" />`（32px 方框四个圆点、45° 起始、1.2s 匀速旋转、各点 1s 明暗交替）。
3. 遮罩带 `aria-busy="true"`、`aria-live="polite"`。
4. `active` 为 false 时不渲染（父应用里跟随 KeepAlive 是否可见）。
5. 如无特殊需求，不另写转圈、骨架屏或「加载中…」文字。

---

## 更新记录

| 版本 | 日期 | 来源 | 变化 |
| --- | --- | --- | --- |
| 1 | 2026-10-22 | #107 | 首次下发 |
