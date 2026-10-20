const OVERFLOW_EPSILON = 1;

export interface OverflowBox {
  scrollWidth: number;
  clientWidth: number;
  scrollHeight: number;
  clientHeight: number;
}

/** 内容是否比可视区域更宽或更高（含多行 line-clamp） */
export const isOverflowing = (el: OverflowBox) =>
  el.scrollWidth > el.clientWidth + OVERFLOW_EPSILON ||
  el.scrollHeight > el.clientHeight + OVERFLOW_EPSILON;

/** 在根节点及其后代里找到第一个发生截断的元素 */
export const findOverflowingElement = (
  root: HTMLElement
): HTMLElement | null => {
  if (isOverflowing(root)) return root;
  const descendants = root.querySelectorAll<HTMLElement>('*');
  for (const node of descendants) {
    if (isOverflowing(node)) return node;
  }
  return null;
};

/** 取出节点可见文本，用作弹层全文 */
export const readElementText = (root: HTMLElement) =>
  (root.textContent ?? '').replace(/\s+/g, ' ').trim();

/** 具备精确指针且支持 hover 时走桌面悬停，否则走长按 */
export const canHoverWithFinePointer = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;
