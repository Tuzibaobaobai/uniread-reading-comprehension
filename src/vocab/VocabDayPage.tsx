import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type { AttemptT, ItemKeyT, LexiconEntryT, VocabDayItemT } from '@schema';
import { staticContent } from '@/lib/content';
import { localAttempts, newAttempt } from '@/lib/storage';
import { allQuestions, isAnswered, type Result } from '@/lib/grading';
import { applyJudgement, fallbackToSelf } from '@/lib/judge';
import { Book, Question } from '@/components/Icons';
import Loading from '@/components/Loading';
import correctIcon from '@/assets/icons/correct.svg';
import wrongIcon from '@/assets/icons/wrong.svg';
import { EntryCard, VocabList } from './VocabList';
import { VocabQuiz, partLabel, type QuizState, type VocabResponses } from './VocabQuiz';
import { useVisualViewport } from './useVisualViewport';

type Tab = 'vocab' | 'quiz';

/**
 * 词汇天天练 day (#110, docs/16): Vocabulary (the day's handbook entries) | Quiz (the day's exercises, one 大题 a page,
 * graded on the server; typed answers only — hints and voice input were taken out for now, #115 #116).
 */
export function VocabDayPage({ item, headSlot }: { item: VocabDayItemT; headSlot: HTMLDivElement | null }) {
  const { t } = useTranslation();
  useVisualViewport();
  const [entries, setEntries] = useState<LexiconEntryT[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState<AttemptT>(() => localAttempts.get(item.id) ?? newAttempt(item.id, item.status.version));
  const submitted = attempt.status === 'submitted' && !!attempt.result;
  const [tab, setTab] = useState<Tab>(() => (attempt.status === 'submitted' || Object.keys(attempt.responses).length ? 'quiz' : 'vocab'));
  const [view, setView] = useState<'quiz' | 'result' | 'review'>(() => (submitted ? 'result' : 'quiz'));
  const [page, setPage] = useState(0);
  const [key, setKey] = useState<ItemKeyT | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<{ status?: number } | null>(null);
  const [confirm, setConfirm] = useState(0);
  const [entryOpen, setEntryOpen] = useState<string | null>(null);
  const sessionStart = useRef(Date.now());

  useEffect(() => {
    Promise.all(item.entryIds.map((id) => staticContent.getEntry(item.lexicon, id))).then(setEntries, (e: Error) => setLoadError(e.message));
  }, [item]);

  const persist = useCallback((a: AttemptT) => {
    setAttempt(a);
    localAttempts.save(a);
  }, []);
  const update = useCallback((fn: (a: AttemptT) => AttemptT) => {
    setAttempt((prev) => {
      const next = fn(prev);
      localAttempts.save(next);
      return next;
    });
  }, []);

  const result = attempt.result as Result | null;
  const review = submitted && key && result ? { key, result } : null;
  const responses = attempt.responses as VocabResponses;
  const hinted = useMemo(() => new Set(attempt.hinted ?? []), [attempt.hinted]);
  const kept = useMemo(() => new Set(attempt.kept ?? []), [attempt.kept]);

  // reviewing an attempt submitted earlier: fetch the key again
  useEffect(() => {
    if (submitted && !key) staticContent.getKey(item, attempt.responses, { hinted: attempt.hinted }).then(setKey, () => undefined);
  }, [submitted, key, item]); // eslint-disable-line react-hooks/exhaustive-deps

  const runJudge = async (a: AttemptT) => {
    const pending = (a.result?.byQuestion ?? []).filter((b) => b.scoredBy === 'pending').map((b) => b.q);
    if (!pending.length) return;
    const verdicts = await Promise.all(
      pending.map((qid) =>
        staticContent.judge
          ? staticContent.judge
              .judge({ itemId: item.id, itemVersion: item.status.version, questionId: qid, response: String(a.responses[qid] ?? '') })
              .then((j) => ({ qid, j }), () => ({ qid, j: null }))
          : Promise.resolve({ qid, j: null }),
      ),
    );
    update((prev) => {
      if (prev.attemptId !== a.attemptId || !prev.result) return prev;
      let r = prev.result as Result;
      verdicts.forEach(({ qid, j }) => (r = j ? applyJudgement(r, qid, j) : r));
      return { ...prev, result: fallbackToSelf(r, verdicts.filter((v) => !v.j).map((v) => v.qid)) };
    });
  };
  useEffect(() => {
    if (submitted && attempt.result?.byQuestion.some((b) => b.scoredBy === 'pending')) void runJudge(attempt);
  }, [attempt.attemptId]); // eslint-disable-line react-hooks/exhaustive-deps

  const questions = useMemo(() => allQuestions(item), [item]);
  const unanswered = questions.filter((q) => !isAnswered(q, responses[q.id] as never)).length;

  const submit = async () => {
    setConfirm(0);
    setSubmitError(null);
    setSubmitting(true);
    try {
      const graded = await staticContent.grade(item, attempt.responses, { hinted: attempt.hinted });
      setKey(graded.key);
      const done: AttemptT = {
        ...attempt,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        durationSec: Math.round(attempt.durationSec + (Date.now() - sessionStart.current) / 1000),
        result: graded.result,
      };
      persist(done);
      setView('result');
      void runJudge(done);
    } catch (e) {
      setSubmitError({ status: (e as { status?: number }).status });
    } finally {
      setSubmitting(false);
    }
  };

  /** a new attempt; `wrongOnly` keeps the questions answered right (read-only) so only the rest are practised */
  const retry = (wrongOnly: boolean) => {
    const right = wrongOnly && result ? result.byQuestion.filter((b) => b.correct === true).map((b) => b.q) : [];
    const fresh = newAttempt(item.id, item.status.version);
    const keepResp = Object.fromEntries(right.map((q) => [q, attempt.responses[q]]).filter(([, v]) => v !== undefined));
    sessionStart.current = Date.now();
    persist({
      ...fresh,
      responses: keepResp,
      hinted: (attempt.hinted ?? []).filter((h) => right.includes(h.split(':')[0])),
      known: attempt.known,
      kept: right.length ? right : undefined,
    });
    setKey(null);
    setView('quiz');
    const firstWrong = item.sections.findIndex((s) => s.questions.some((q) => !right.includes(q.id)));
    setPage(Math.max(0, firstWrong));
  };

  // save elapsed time when leaving mid-attempt
  useEffect(
    () => () => {
      const a = localAttempts.get(item.id);
      if (a && a.status === 'in_progress') localAttempts.save({ ...a, durationSec: Math.round(a.durationSec + (Date.now() - sessionStart.current) / 1000) });
    },
    [item.id],
  );

  const state: QuizState = {
    item,
    responses,
    setResponse: (qid, value) => update((a) => (a.status === 'submitted' ? a : { ...a, responses: { ...a.responses, [qid]: value } })),
    hinted,
    kept,
    review: view === 'review' ? review : null,
    onOpenEntry: setEntryOpen,
  };

  const tabs = (
    <div className="mode-tabs" role="tablist" aria-label={t('vocab.tabs')}>
      <button role="tab" aria-selected={tab === 'vocab'} className={`mode-tab ${tab === 'vocab' ? 'is-active' : ''}`} onClick={() => setTab('vocab')}>
        <Book /> {t('vocab.tabVocab')}
      </button>
      <span className="mode-tab-sep" aria-hidden />
      <button role="tab" aria-selected={tab === 'quiz'} className={`mode-tab ${tab === 'quiz' ? 'is-active' : ''}`} onClick={() => setTab('quiz')}>
        <Question /> {t('vocab.tabQuiz')}
      </button>
    </div>
  );

  const entryById = new Map(entries?.map((e) => [e.id, e]));
  const open = entryOpen ? entryById.get(entryOpen) : undefined;

  return (
    <div className={`vocab-day tab-${tab}`}>
      {headSlot ? createPortal(tabs, headSlot) : tabs}
      {tab === 'vocab' && (
        <section className="vocab-pane app-scroll thin-scroll">
          {loadError && <p className="error">{t('common.loadFailed', { message: loadError })}</p>}
          {!entries && !loadError && <Loading />}
          {entries && (
            <VocabList
              entries={entries}
              known={attempt.known ?? {}}
              onKnown={(id, v) =>
                update((a) => {
                  const known = { ...a.known };
                  if (v === null) delete known[id];
                  else known[id] = v;
                  return { ...a, known };
                })
              }
            />
          )}
        </section>
      )}
      {tab === 'quiz' && (
        <section className="vocab-pane quiz-pane">
          {view === 'result' && result ? (
            <ResultView item={item} result={result} onReview={() => (setView('review'), setPage(0))} onRetry={retry} reviewReady={!!key} />
          ) : view === 'review' && !review ? (
            <Loading />
          ) : (
            <VocabQuiz
              state={state}
              page={page}
              setPage={setPage}
              submitting={submitting}
              onSubmit={() => (unanswered ? setConfirm(unanswered) : void submit())}
              onShowResult={() => setView('result')}
            />
          )}
          {submitError && (
            <p className="submit-error" role="alert">
              {submitError.status ? t('reader.gradeUnavailable', { status: submitError.status }) : t('reader.networkError')}
            </p>
          )}
        </section>
      )}
      {confirm > 0 && (
        <div className="dialog-backdrop" role="presentation" onClick={() => setConfirm(0)}>
          <div className="dialog" role="dialog" aria-modal aria-labelledby="vq-confirm" onClick={(e) => e.stopPropagation()}>
            <h2 id="vq-confirm">{t('vocab.quiz.unanswered', { count: confirm })}</h2>
            <p>{t('reader.unansweredHint')}</p>
            <div className="dialog-actions">
              <button className="pill-button" onClick={() => void submit()}>
                {t('reader.submitAnyway')}
              </button>
              <button className="pill-button primary" autoFocus onClick={() => setConfirm(0)}>
                {t('reader.keepAnswering')}
              </button>
            </div>
          </div>
        </div>
      )}
      {open && (
        <div className="dialog-backdrop" role="presentation" onClick={() => setEntryOpen(null)}>
          <div className="dialog entry-dialog" role="dialog" aria-modal aria-label={open.headword} onClick={(e) => e.stopPropagation()}>
            <button className="dialog-close" onClick={() => setEntryOpen(null)} aria-label={t('common.close')}>
              ×
            </button>
            <EntryCard entry={open} as="div" />
          </div>
        </div>
      )}
    </div>
  );
}

/** Figma Quiz 完成结果 (15643-204521): passed / not passed, pass rate, each 大题, View Answers / Try Again */
function ResultView({
  item,
  result,
  onReview,
  onRetry,
  reviewReady,
}: {
  item: VocabDayItemT;
  result: Result;
  onReview: () => void;
  onRetry: (wrongOnly: boolean) => void;
  reviewReady: boolean;
}) {
  const { t } = useTranslation();
  const total = item.meta.totalPoints;
  const pending = result.byQuestion.some((b) => b.scoredBy === 'pending');
  const percent = Math.round((result.score / total) * 100);
  const passed = percent >= item.meta.passPercent;
  const wrong = result.byQuestion.filter((b) => b.correct !== true).length;
  return (
    <div className="question-card vq-result">
      <h2 className="vq-result-title">{passed ? t('vocab.result.passed') : t('vocab.result.failed')}</h2>
      <p className="vq-result-score">
        {t('vocab.result.score', { score: Math.round(result.score * 10) / 10, total, percent, pass: item.meta.passPercent })}
        {pending && <span className="vq-result-pending"> {t('vocab.result.pending')}</span>}
      </p>
      <ul className="vq-result-sections">
        {item.sections.map((s, i) => {
          const rows = result.byQuestion.filter((b) => s.questions.some((q) => q.id === b.q));
          const got = rows.reduce((n, r) => n + r.points, 0);
          const max = rows.reduce((n, r) => n + r.maxPoints, 0);
          const ok = rows.every((r) => r.correct === true);
          return (
            <li key={s.id}>
              <img src={ok ? correctIcon : wrongIcon} alt={ok ? t('reader.dotCorrect') : t('reader.dotWrong')} />
              <span className="vq-result-label">{partLabel(i)}</span>
              <span className="vq-result-points">
                {Math.round(got * 10) / 10}/{max}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="vq-result-actions">
        <button className="vq-result-card" onClick={onReview} disabled={!reviewReady}>
          <b>{t('vocab.result.view')}</b>
          <span>{t('vocab.result.viewHint')}</span>
        </button>
        <button className="vq-result-card" onClick={() => onRetry(wrong > 0)}>
          <b>{wrong > 0 ? t('vocab.result.retryWrong') : t('vocab.result.retryAll')}</b>
          <span>{wrong > 0 ? t('vocab.result.retryWrongHint', { count: wrong }) : t('vocab.result.retryAllHint')}</span>
        </button>
      </div>
      {wrong > 0 && (
        <button className="pill-button vq-result-all" onClick={() => onRetry(false)}>
          {t('vocab.result.retryAll')}
        </button>
      )}
    </div>
  );
}
