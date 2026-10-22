import type { FC } from 'react';
import { createPortal } from 'react-dom';
import styles from './index.module.scss';

/**
 * 页面级加载：全屏半透明遮罩 + 居中的转圈指示，与父应用（UniRead）的 Loading 表现一致（GitHub #107）。
 * 父应用的实现是 antd `<Spin size="large" />`；本组件不依赖 antd，用 CSS 按 antd v5 Spin（large）原样还原：
 * 32px 方框内四个圆点，45° 起始、1.2s 匀速旋转，各点 1s 透明度交替（0.4s 依次错开），颜色取主色。
 * 已经使用 antd 的项目可直接用同目录的 `Loading.antd.tsx`（附件原版）。
 *
 * - 用在“整页数据还没回来”的地方；按钮内的小转圈（如识别中）不要换成它。
 * - 渲染到 document.body，盖住整页并拦截点击；`active={false}` 时不渲染（对应父应用 KeepAlive 页面不可见）。
 */
const Loading: FC<{ active?: boolean; label?: string }> = ({ active = true, label = '加载中' }) => {
  if (!active || typeof document === 'undefined') return null;
  return createPortal(
    <div className={styles.loadingMask} role="status" aria-busy="true" aria-live="polite" aria-label={label}>
      <span className={styles.spinDot} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
    </div>,
    document.body,
  );
};

export default Loading;
