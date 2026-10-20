import React, { useEffect, useRef } from 'react';
import classNames from 'classnames';
import styles from './index.module.css';

/**
 * 文字自适应缩放组件。
 *
 * 当文本宽或高超出容器时，自动缩小字号直至适配（最小 1px）；文本较短时保持 CSS 定义的最大字号。
 * 适用于固定宽/高容器内的标题、菜单文案等单行文本场景。
 * 高度缩放仅在父级通过 height / max-height / flex 等约束了容器高度时生效。
 *
 * @example
 * <FittyText className={styles.title}>{label}</FittyText>
 */
export interface FittyTextProps {
  children: React.ReactNode;
  /** 自定义样式，字号相关属性（font-size / font-weight 等）会作为缩放上限 */
  className?: string;
}

/** 浏览器可渲染的最小字号，无额外下限保护 */
const MIN_FONT_SIZE = 1;

/** 当前字号下文本是否完整落在容器内（同时满足宽、高） */
const fitsContainer = (el: HTMLElement) =>
  el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight;

/**
 * 在 [1px, CSS 字号] 范围内二分查找最大可用字号。
 * 基于元素自身的 clientWidth / clientHeight 测量；
 * 父级需通过 flex / width 约束宽度，若需高度适配则还需约束高度。
 */
const fitText = (el: HTMLElement) => {
  if (!el.clientWidth) {
    return;
  }

  el.style.fontSize = '';
  // 清除内联字号后读取 CSS 定义值，作为缩放上限
  const resolvedMax =
    parseFloat(getComputedStyle(el).fontSize) || MIN_FONT_SIZE;

  let low = MIN_FONT_SIZE;
  let high = Math.round(resolvedMax);
  let best = MIN_FONT_SIZE;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    el.style.fontSize = `${mid}px`;

    if (fitsContainer(el)) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  el.style.fontSize = `${best}px`;
};

const FittyText: React.FC<FittyTextProps> = ({ children, className }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    const refit = () => {
      fitText(el);
    };

    refit();
    // 自定义字体加载完成后重新计算，避免初次测量宽度偏差
    document.fonts?.ready.then(refit);

    // 容器尺寸或内容变化时重新适配
    const resizeObserver = new ResizeObserver(refit);
    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
      el.style.fontSize = '';
    };
  }, [children]);

  return (
    <div ref={ref} className={classNames(styles.root, className)}>
      {children}
    </div>
  );
};

export default FittyText;
