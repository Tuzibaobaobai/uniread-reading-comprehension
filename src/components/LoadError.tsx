import { useTranslation } from 'react-i18next';
import { InlineNotice } from '@/ui/common/InlineNotice/InlineNotice';
import { Chip } from '@/ui/common/Chip/Chip';
import './LoadError.css';

/**
 * a page that could not load: a learner-readable message (not the raw "Unexpected token '<'…" / "500 catalog.json")
 * and a way on — back to where the learner came from, and 重试 when it may be a passing network or server problem.
 * Built from rc/Common/InlineNotice + rc/Common/Chip.
 */
export function LoadError({ error, notFound = false, notFoundText, back, onRetry }: { error?: unknown; notFound?: boolean; notFoundText?: string; back: { label: string; onClick: () => void }; onRetry?: () => void }) {
  const { t } = useTranslation();
  const message = error instanceof Error ? error.message : String(error ?? '');
  // a missing file comes back as the app's own HTML page (JSON parse error) or a 404
  const missing = notFound || /not valid JSON|Unexpected token|\b404\b/i.test(message);
  return (
    <div className="load-error">
      <InlineNotice
        role="alert"
        tone={missing ? 'info' : 'danger'}
        actions={
          <>
            {!missing && onRetry && <Chip onClick={onRetry}>{t('common.retry')}</Chip>}
            <Chip onClick={back.onClick}>{back.label}</Chip>
          </>
        }
      >
        {missing ? (notFoundText ?? t('common.notFound')) : t('common.loadFailedFriendly')}
      </InlineNotice>
    </div>
  );
}
