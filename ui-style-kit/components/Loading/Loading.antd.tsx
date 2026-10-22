import React from 'react';
import { createPortal } from 'react-dom';
import { Spin } from 'antd';
import styles from './index.module.scss';

/**
 * 附件原版（父应用使用 antd 时直接用这一版）。父应用里的 `useKeepAliveActive()` 改为 `active` 参数：
 * 有 KeepAlive 的项目传入该 hook 的结果即可。
 */

const Loading: React.FC<{ active?: boolean }> = ({ active = true }) => {
  if (!active) {
    return null;
  }

  return createPortal(
    <div className={styles.loadingMask} aria-busy='true' aria-live='polite'>
      <Spin size='large' spinning />
    </div>,
    document.body
  );
};

export default Loading;
