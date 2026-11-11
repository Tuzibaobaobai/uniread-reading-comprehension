import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import warningIcon from '@/assets/icons/message-warning.svg';
import './Message.css';

/**
 * ui/Message — UniRead Message (19515:130767, the Ant-based UIKit toast), reused (design-system/components.registry.json
 * `ui/Message`; the designer's Ready-for-dev frames 1.19 判分服务不可用 and 2.27 语音识别不可用): a white toast centred
 * at the top of the page with the filled exclamation icon. Variant Type=warning (the only one RC uses). It stays while
 * the caller renders it (the condition it reports is still true) and is announced (`role`, default alert). Rendered
 * into #root so the panes' containment cannot pin it inside a card.
 */
export function Message({ role = 'alert', className = '', children }: { role?: 'alert' | 'status'; className?: string; children: ReactNode }) {
  const node = (
    <div className={['ur-message', 'is-warning', className].filter(Boolean).join(' ')} role={role}>
      <img className="ur-message-icon" src={warningIcon} alt="" width={20} height={20} />
      <span className="ur-message-text">{children}</span>
    </div>
  );
  if (typeof document === 'undefined') return node;
  return createPortal(node, document.getElementById('root') ?? document.body);
}
