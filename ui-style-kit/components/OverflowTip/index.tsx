import {
  memo,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { useMemoizedFn } from 'ahooks';
import cln from 'classnames';
import {
  autoUpdate,
  FloatingPortal,
  flip,
  offset,
  safePolygon,
  shift,
  useDismiss,
  useFloating,
  useHover,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import {
  canHoverWithFinePointer,
  findOverflowingElement,
  readElementText,
} from './overflow';
import styles from './index.module.scss';

const LONG_PRESS_MS = 450;
const MOVE_CANCEL_PX = 8;

export interface OverflowTipProps {
  children: ReactNode;
  /** 覆盖自动提取的全文；默认用子节点 textContent */
  content?: ReactNode;
  className?: string;
  /** 为 true 时不检测截断、也不弹出 */
  disabled?: boolean;
}

/**
 * 文案被截断时展示全文。不改变字号，也不负责省略号。
 * 调用方必须自己让子元素溢出（单行 ellipsis 或多行 line-clamp）。
 * 桌面：悬停弹出；触控：长按弹出（避免与卡片点击进入冲突）。
 */
const OverflowTip = memo(function OverflowTip({
  children,
  content,
  className,
  disabled,
}: OverflowTipProps) {
  // 弹层开关；仅在确有截断且有全文时打开
  const [open, setOpen] = useState(false);
  // 本次弹出要展示的全文（打开时冻结，避免布局变化改字）
  const [tipContent, setTipContent] = useState<ReactNode>('');
  // 当前是否走桌面 hover；触控设备为 false
  const [hoverable, setHoverable] = useState(canHoverWithFinePointer);
  // 长按计时器；移动超过阈值或松手时清掉
  const pressTimerRef = useRef<number | null>(null);
  // 本次按下的起点，用于判断是否滑走
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);
  // 长按成功后吞掉随后的 click，避免点进卡片
  const suppressClickRef = useRef(false);
  // useFloating 的 onOpenChange 早于 prepareOpen 声明，经 ref 读取最新测量函数
  const prepareOpenRef = useRef<() => boolean>(() => false);

  // hover / dismiss 请求打开时先测量，未截断则不弹出
  const handleOpenChange = useMemoizedFn((nextOpen: boolean) => {
    if (nextOpen && !prepareOpenRef.current()) return;
    setOpen(nextOpen);
  });

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: handleOpenChange,
    placement: 'top',
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
  });

  const hover = useHover(context, {
    enabled: hoverable && !disabled,
    handleClose: safePolygon({ buffer: 2 }),
    restMs: 80,
    delay: { open: 80, close: 80 },
  });
  const dismiss = useDismiss(context, {
    enabled: open,
    referencePress: false,
    ancestorScroll: true,
  });
  const role = useRole(context, { role: 'tooltip' });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    dismiss,
    role,
  ]);

  // 指针能力变化时切换 hover / 长按（如 iPad 外接鼠标）
  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)');
    const syncHoverable = () => setHoverable(media.matches);
    syncHoverable();
    media.addEventListener('change', syncHoverable);
    return () => media.removeEventListener('change', syncHoverable);
  }, []);

  useEffect(
    () => () => {
      if (pressTimerRef.current != null) {
        window.clearTimeout(pressTimerRef.current);
      }
    },
    []
  );

  // 测量是否截断，并准备弹层文案；不满足则不允许打开
  const prepareOpen = useMemoizedFn(() => {
    if (disabled) return false;
    const el = refs.domReference.current;
    if (!(el instanceof HTMLElement)) return false;
    if (!findOverflowingElement(el)) return false;
    const nextContent =
      content != null && content !== '' ? content : readElementText(el);
    if (nextContent === '' || nextContent == null) return false;
    setTipContent(nextContent);
    return true;
  });
  prepareOpenRef.current = prepareOpen;

  // 清掉尚未触发的长按计时
  const clearPressTimer = useMemoizedFn(() => {
    if (pressTimerRef.current == null) return;
    window.clearTimeout(pressTimerRef.current);
    pressTimerRef.current = null;
  });

  // 触控按下：开始长按计时；鼠标交给 hover
  const handlePointerDown = useMemoizedFn((event: PointerEvent) => {
    if (disabled || hoverable || event.pointerType === 'mouse') return;
    pressStartRef.current = { x: event.clientX, y: event.clientY };
    clearPressTimer();
    pressTimerRef.current = window.setTimeout(() => {
      pressTimerRef.current = null;
      if (!prepareOpen()) return;
      suppressClickRef.current = true;
      setOpen(true);
    }, LONG_PRESS_MS);
  });

  // 手指滑开则取消长按，避免和滚动冲突
  const handlePointerMove = useMemoizedFn((event: PointerEvent) => {
    const start = pressStartRef.current;
    if (!start || pressTimerRef.current == null) return;
    if (
      Math.hypot(event.clientX - start.x, event.clientY - start.y) >
      MOVE_CANCEL_PX
    ) {
      clearPressTimer();
    }
  });

  // 松手或中断时丢掉长按计时
  const handlePointerEnd = useMemoizedFn(() => {
    clearPressTimer();
    pressStartRef.current = null;
  });

  // 长按期间阻止系统菜单，避免和全文弹层抢手势
  const handleContextMenu = useMemoizedFn((event: MouseEvent) => {
    if (hoverable) return;
    event.preventDefault();
  });

  // 长按成功后吞掉 click，避免触发父级卡片跳转
  const handleClickCapture = useMemoizedFn((event: MouseEvent) => {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  });

  // 点弹层自身即可收起（触控没有 hover 离开）
  const handleTipClick = useMemoizedFn(() => {
    setOpen(false);
  });

  return (
    <>
      <span
        ref={refs.setReference}
        className={cln(styles.root, className)}
        {...getReferenceProps({
          onPointerDown: handlePointerDown,
          onPointerMove: handlePointerMove,
          onPointerUp: handlePointerEnd,
          onPointerCancel: handlePointerEnd,
          onContextMenu: handleContextMenu,
          onClickCapture: handleClickCapture,
        })}
      >
        {children}
      </span>
      {open ? (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className={styles.tip}
            {...getFloatingProps({
              onClick: handleTipClick,
            })}
          >
            <span className={styles.tipText}>{tipContent}</span>
          </div>
        </FloatingPortal>
      ) : null}
    </>
  );
});

export default OverflowTip;
