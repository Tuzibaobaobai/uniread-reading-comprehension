import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type { AttemptT, ItemKeyT, LexiconEntryT, LexiconT, VocabDayItemT } from '@schema';
import { staticContent } from '@/lib/content';
import { localAttempts, newAttempt } from '@/lib/storage';
import { allQuestions, isAnswered, totals, type Result } from '@/lib/grading';
import { applyJudgement, emptyJudgement, fallbackToSelf, isBlankResponse } from '@/lib/judge';
import Loading from '@/components/Loading';
import { VocabList } from './VocabList';
import { EntryCard } from '@/ui/vocab/EntryCard/EntryCard';
import { EntryDialog } from '@/ui/vocab/EntryDialog/EntryDialog';
import { StepTabs } from '@/ui/StepTabs/StepTabs';
import { QuizButton } from '@/ui/QuizButton/QuizButton';
import { QuizResult } from '@/ui/quiz/QuizResult/QuizResult';
import { VocabScan } from './VocabScan';
import { VocabQuiz, partLabel, type QuizState, type VocabResponses } from './VocabQuiz';
import { useVisualViewport } from './useVisualViewport';
import { useModal } from '@/ui/common/Dialog/useModal';
import FittyText from '@/components/FittyText';

type Tab = 'scan' | 'study' | 'quiz';

/**
 * 词汇天天练 day (#110, docs/16), three steps (#133): Scan (one word a page, 认识 / 不认识) | Study (the day's handbook
 * entries, coloured and folded by the Scan marks) | Quiz (the day's exercises, one 大题 a page, graded on the server; typed
 * answers only — hints and voice input were taken out for now, #115 #116).
 */
export function VocabDayPage({ item, headSlot }: { item: VocabDayItemT; headSlot: HTMLDivElement | null }) {
  const { t } = useTranslation();
  useVisualViewport();
  const [entries, setEntries] = useState<LexiconEntryT[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState<AttemptT>(() => localAttempts.get(item.id) ?? newAttempt(item.id, item.status.version));
  const submitted = attempt.status === 'submitted' && !!attempt.result;
  // where the learner left off: a quiz under way → Quiz; every word marked → Study; else Scan
  const [tab, setTab] = useState<Tab>(() =>
    attempt.status === 'submitted' || Object.keys(attempt.responses).length
      ? 'quiz'
      : item.entryIds.every((id) => attempt.known?.[id] !== undefined)
        ? 'study'
        : 'scan',
  );
  // Scan: the first word not marked yet (all marked → the summary)
  const [scanIndex, setScanIndex] = useState(() => {
    const i = item.entryIds.findIndex((id) => attempt.known?.[id] === undefined);
    return i < 0 ? item.entryIds.length : i;
  });
  const [view, setView] = useState<'quiz' | 'result' | 'review'>(() => (submitted ? 'result' : 'quiz'));
  const [page, setPage] = useState(0);
  const [key, setKey] = useState<ItemKeyT | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<{ status?: number } | null>(null);
  const [confirm, setConfirm] = useState(0);
  const [entryOpen, setEntryOpen] = useState<string | null>(null);
  // a review row can point to an entry from another day of the same book (entryRef outside entryIds): fetched on demand
  const [extraEntries, setExtraEntries] = useState<Map<string, LexiconEntryT>>(new Map());
  const sessionStart = useRef(Date.now());

  const [marks, setMarks] = useState<LexiconT['marks']>([]);
  useEffect(() => {
    Promise.all(item.entryIds.map((id) => staticContent.getEntry(item.lexicon, id))).then(setEntries, (e: Error) => setLoadError(e.message));
    // the legend is optional: without lexicon.json the entries still show
    staticContent.getLexicon(item.lexicon).then((l) => setMarks(l.marks), () => setMarks([]));
  }, [item]);
  useEffect(() => {
    if (!entryOpen || !entries || entries.some((e) => e.id === entryOpen) || extraEntries.has(entryOpen)) return;
    let live = true;
    staticContent.getEntry(item.lexicon, entryOpen).then(
      (e) => live && setExtraEntries((m) => new Map(m).set(e.id, e)),
      () => live && setEntryOpen(null),
    );
    return () => {
      live = false;
    };
  }, [entryOpen, entries, extraEntries, item.lexicon]);

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

  /** 中译英 by the LLM judge against the reference translations; each verdict shows as soon as it arrives (#125) */
  const runJudge = async (a: AttemptT) => {
    const pending = (a.result?.byQuestion ?? []).filter((b) => b.scoredBy === 'pending').map((b) => b.q);
    const apply = (qid: string, j: Parameters<typeof applyJudgement>[2] | null) => {
      const change = (prev: AttemptT): AttemptT => {
        if (prev.attemptId !== a.attemptId || !prev.result) return prev;
        const r = prev.result as Result;
        return { ...prev, result: j ? applyJudgement(r, qid, j) : fallbackToSelf(r, [qid]) };
      };
      // saved even when the learner has left the day meanwhile (no re-judging on the next visit)
      const stored = localAttempts.get(item.id);
      if (stored) localAttempts.save(change(stored));
      update(change);
    };
    await Promise.all(
      pending.map((qid) =>
        // #147: unanswered reads 还没有作答 even when the judge is down — no model needed
        isBlankResponse(a.responses[qid])
          ? apply(qid, emptyJudgement((a.result as Result).byQuestion.find((b) => b.q === qid)?.maxPoints ?? 0))
          : staticContent.judge
          ? staticContent.judge
              .judge({ itemId: item.id, itemVersion: item.status.version, questionId: qid, response: String(a.responses[qid] ?? '') })
              .then((j) => apply(qid, j), () => apply(qid, null))
          : apply(qid, null),
      ),
    );
  };
  /**
   * Chinese meanings the model meaning check could not look at (service down / timed out) are not the learner's
   * mistakes: grade the day again a few times in the background — and again whenever it is opened — and take the new
   * rule + meaning verdicts for the auto-scored rows (judged 中译英 rows stay as they are)
   */
  const recheckMeanings = async (a: AttemptT, tries = 3) => {
    for (let i = 0; i < tries; i++) {
      if (i) await new Promise((ok) => window.setTimeout(ok, 4000 * i));
      let fresh: Result;
      try {
        fresh = (await staticContent.grade(item, a.responses, { hinted: a.hinted })).result as Result;
      } catch {
        continue;
      }
      if (fresh.meaningUnchecked?.length) continue;
      const change = (prev: AttemptT): AttemptT => {
        if (prev.attemptId !== a.attemptId || !prev.result) return prev;
        const r = prev.result as Result;
        const byQuestion = r.byQuestion.map((b) => (b.scoredBy && b.scoredBy !== 'auto' ? b : (fresh.byQuestion.find((f) => f.q === b.q) ?? b)));
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { meaningUnchecked, ...rest } = r;
        return { ...prev, result: { ...rest, ...totals(byQuestion), byQuestion } };
      };
      const stored = localAttempts.get(item.id);
      if (stored) localAttempts.save(change(stored));
      update(change);
      return;
    }
  };

  useEffect(() => {
    if (!submitted || !attempt.result) return;
    if ((attempt.result as Result).meaningUnchecked?.length) void recheckMeanings(attempt);
    // #147: 中译英 left to self-check because the judge was down are tried again when the attempt is opened again
    const r = attempt.result as Result;
    if (staticContent.judge && r.byQuestion.some((b) => b.scoredBy === 'self')) {
      const byQuestion = r.byQuestion.map((b) => (b.scoredBy === 'self' ? { ...b, scoredBy: 'pending' as const } : b));
      const again = { ...attempt, result: { ...r, ...totals(byQuestion), byQuestion } };
      persist(again);
      void runJudge(again);
    } else if (r.byQuestion.some((b) => b.scoredBy === 'pending')) void runJudge(attempt);
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
      if (graded.result.meaningUnchecked?.length) void recheckMeanings(done);
    } catch (e) {
      setSubmitError({ status: (e as { status?: number }).status });
    } finally {
      setSubmitting(false);
    }
  };

  /** a new attempt; `wrongOnly` keeps the questions answered right (read-only) so only the rest are practised */
  const retry = (wrongOnly: boolean) => {
    // 只练错题: answers right — and translations not marked yet, which keep their answer and are marked again — stay
    const right = wrongOnly && result ? result.byQuestion.filter((b) => b.correct === true || isAwaiting(b)).map((b) => b.q) : [];
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
    // one field of a multi-part answer, merged into the latest saved answer (not a copy from the last render, which
    // could drop a field typed just before when two updates land in one frame)
    setField: (qid, field, v) =>
      update((a) => {
        if (a.status === 'submitted') return a;
        const prev = a.responses[qid];
        const rec = prev && typeof prev === 'object' && !Array.isArray(prev) ? (prev as Record<string, string>) : {};
        return { ...a, responses: { ...a.responses, [qid]: { ...rec, [field]: v } } };
      }),
    hinted,
    kept,
    review: view === 'review' ? review : null,
    onOpenEntry: setEntryOpen,
  };

  const tabs = (
    <StepTabs<Tab>
      label={t('vocab.tabs')}
      steps={[
        { id: 'scan', label: t('vocab.tabScan') },
        { id: 'study', label: t('vocab.tabStudy') },
        { id: 'quiz', label: t('vocab.tabQuiz') },
      ]}
      current={tab}
      onSelect={setTab}
    />
  );

  const entryById = new Map(entries?.map((e) => [e.id, e]));
  const open = entryOpen ? (entryById.get(entryOpen) ?? extraEntries.get(entryOpen)) : undefined;

  return (
    <div className={`vocab-day tab-${tab}`}>
      {headSlot ? createPortal(tabs, headSlot) : tabs}
      {tab !== 'quiz' && (
        <section className={`vocab-pane ${tab === 'study' ? 'app-scroll thin-scroll' : 'scan-pane'}`}>
          {loadError && <p className="error">{t('common.loadFailed', { message: loadError })}</p>}
          {!entries && !loadError && <Loading />}
          {entries && tab === 'scan' && (
            <VocabScan
              entries={entries}
              known={attempt.known ?? {}}
              index={scanIndex}
              setIndex={setScanIndex}
              onKnown={(id, v) => update((a) => ({ ...a, known: { ...a.known, [id]: v } }))}
              onStudy={() => setTab('study')}
            />
          )}
          {entries && tab === 'study' && <VocabList entries={entries} marks={marks} known={attempt.known ?? {}} />}
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
        <ModalShell onClose={() => setConfirm(0)}>
          <div className="dialog" role="dialog" aria-modal aria-labelledby="vq-confirm" onClick={(e) => e.stopPropagation()}>
            <h2 id="vq-confirm">{t('vocab.quiz.unanswered', { count: confirm })}</h2>
            <p>{t('reader.unansweredHint')}</p>
            <div className="dialog-actions">
              <QuizButton onClick={() => void submit()}>
                <FittyText>{t('reader.submitAnyway')}</FittyText>
              </QuizButton>
              <QuizButton variant="primary" autoFocus onClick={() => setConfirm(0)}>
                <FittyText>{t('reader.keepAnswering')}</FittyText>
              </QuizButton>
            </div>
          </div>
        </ModalShell>
      )}
      {open && (
        <EntryDialog label={open.headword} title={t('vocab.result.openEntry')} closeLabel={t('common.close')} onClose={() => setEntryOpen(null)}>
          <EntryCard entry={open} marks={marks} as="div" />
        </EntryDialog>
      )}
    </div>
  );
}

/** a judged answer with no mark yet: still being marked, or left for re-judging while the judge was down (#147) */
const isAwaiting = (b: Result['byQuestion'][number]) => b.scoredBy === 'pending' || b.scoredBy === 'self';

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
  // 中译英 still being marked, or left unmarked while the judge was down: neither right nor wrong yet
  const awaiting = result.byQuestion.filter(isAwaiting);
  const open = awaiting.reduce((n, b) => n + b.maxPoints, 0);
  const passMark = (item.meta.passPercent * total) / 100;
  // the result is only final when the unmarked answers cannot change it: passed even if they all score 0, or not passed
  // even if they all score full marks
  const passed = result.score >= passMark - 1e-6;
  const decided = passed || result.score + open < passMark - 1e-6;
  const wrong = result.byQuestion.filter((b) => b.correct !== true && !isAwaiting(b)).length;
  return (
    <QuizResult
      pass={passed}
      title={!decided ? t('vocab.result.awaitingTitle') : passed ? t('vocab.result.passed') : t('vocab.result.failed')}
      // #140: a whole-number score (some 高考 blanks are worth 0.88 of a point) and the pass mark in points
      score={t('vocab.result.score', { score: Math.round(result.score), total, pass: Math.round(passMark) })}
      pending={pending ? t('vocab.result.pending') : awaiting.length ? t('vocab.result.unjudged') : undefined}
      parts={item.sections.map((s, i) => {
        const rows = s.questions.map((q) => result.byQuestion.find((b) => b.q === q.id));
        const right = rows.filter((r) => r?.correct === true).length;
        const marking = rows.some((r) => r && isAwaiting(r));
        const from = s.questions[0]?.number;
        const to = s.questions[s.questions.length - 1]?.number;
        const range = from === to ? `${from}` : `${from}–${to}`;
        return {
          key: s.id,
          kicker: t('vocab.result.partKicker', { n: i + 1 }),
          range: from === to ? t('vocab.result.partRangeOne', { n: from }) : t('vocab.result.partRange', { from, to }),
          // #140: each 大题 as questions right / questions, not points
          points: marking ? t('vocab.result.partAwaiting') : `${right}/${s.questions.length}`,
          // #147: a 中译英 not marked (judge down → self-check, or still marking) is neither right nor wrong
          marks: rows.map((r) =>
            r?.correct === true ? true : r?.scoredBy === 'self' || r?.scoredBy === 'pending' ? null : r && r.points > 0 ? ('partial' as const) : false,
          ),
          label: t('vocab.result.partCard', { part: partLabel(t, i), range, score: `${right}/${s.questions.length}` }),
        };
      })}
      // Figma 3.24: nothing wrong → only the outline 查看答案; 3.25: 查看答案 + 只练错题 (steered to when not passed) + 全部重做
      {...(wrong > 0
        ? {
            actions: [
              { key: 'view', title: t('vocab.result.view'), hint: t('vocab.result.viewHint'), onClick: onReview, disabled: !reviewReady },
              {
                key: 'retry',
                title: t('vocab.result.retryWrong'),
                hint: t('vocab.result.retryWrongHint', { count: wrong }),
                onClick: () => onRetry(true),
                recommended: !passed,
              },
            ],
            secondary: { label: t('vocab.result.retryAll'), onClick: () => onRetry(false) },
          }
        : { primary: { label: t('vocab.result.view'), onClick: onReview, disabled: !reviewReady } })}
    />
  );
}

/** backdrop of the submit confirm: modal for keyboard / screen readers (focus trap, Esc, inert page) */
function ModalShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useModal(ref, onClose);
  return (
    <div ref={ref} className="dialog-backdrop" role="presentation" onClick={onClose}>
      {children}
    </div>
  );
}
