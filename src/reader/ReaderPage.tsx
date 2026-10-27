import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isExam, type AttemptT, type ItemKeyT, type ItemT } from '@schema';
import { staticContent } from '@/lib/content';
import { localAttempts, newAttempt } from '@/lib/storage';
import { isScored, type Result } from '@/lib/grading';
import { applyJudgement, fallbackToSelf } from '@/lib/judge';
import { BackArrow, Check, Cross, Locate } from '@/components/Icons';
import Loading from '@/components/Loading';
import correctIcon from '@/assets/icons/correct.svg';
import wrongIcon from '@/assets/icons/wrong.svg';
import { Rich, plainText, type BlankNode } from '@/components/Rich';
import { ArticlePane } from './ArticlePane';
import { ExamPane } from './ExamPane';
import { ExamReport, ExamTimer, ModeDialog, ModeSelect, SwitchModeDialog, type ModeReason } from './ExamChrome';
import { examEndsAt } from '@/lib/exam-status';
import { SpeakingView } from './Speaking';
import { MatchBoardView, SectionAllView, SectionTableView } from './PartViews';
import { QuestionStrip } from './QuestionStrip';
import { paint, sentenceRange } from './evidence';
import {
  ChoiceView,
  ExtendedTextView,
  GapMatchView,
  InlineChoiceView,
  MatchView,
  OrderView,
  orderSentence,
  TextEntryView,
  ChooseTaskView,
  Emph,
  hasImageOptions,
  type InteractionProps,
} from './interactions';
import { blankCorrect, blankOwners, blankText, correctBlankText, evidenceOf, flatten, pageAnswered, scoreOnly, showFirstLetter, type Responses } from './model';
import OverflowTip from '@/components/OverflowTip';

export function ReaderPage() {
  const { playlistId = '', itemId = '' } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [item, setItem] = useState<ItemT | null>(null);
  const [error, setError] = useState<string | null>(null);
  // header slot for the reader's own controls (exam mode select, #102)
  const [headSlot, setHeadSlot] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    setItem(null);
    staticContent.getItem(itemId).then(setItem, (e: Error) => setError(e.message));
  }, [itemId]);

  return (
    <div className="reader">
      <header className="reader-head">
        <button className="back-button" onClick={() => navigate(`/p/${playlistId}`)} aria-label={t('reader.backToPlaylist')}>
          <BackArrow />
        </button>
        <OverflowTip className="reader-head-title">{item?.title ?? ''}</OverflowTip>
        <div className="reader-head-actions" ref={setHeadSlot} />
      </header>
      {error && <p className="error">{t('common.loadFailed', { message: error })}</p>}
      {!item && !error && <Loading />}
      {item && <Reader key={item.id} item={item} headSlot={headSlot} />}
    </div>
  );
}

type Tab = 'article' | 'questions';

function Reader({ item, headSlot }: { item: ItemT; headSlot: HTMLDivElement | null }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const flat = useMemo(() => flatten(item), [item]);
  const owners = useMemo(() => blankOwners(flat), [flat]);

  const [attempt, setAttempt] = useState<AttemptT>(() => localAttempts.get(item.id) ?? newAttempt(item.id, item.status.version));
  const [index, setIndex] = useState(() => Math.max(0, flat.findIndex((f) => pageKey(f) === localAttempts.getPosition(item.id))));
  const [key, setKey] = useState<ItemKeyT | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // narrow screens: open on the questions tab when coming back to review a submitted attempt
  const [tab, setTab] = useState<Tab>(() => (attempt.status === 'submitted' ? 'questions' : 'article'));
  const articleRef = useRef<HTMLDivElement>(null);
  const sessionStart = useRef(Date.now());
  const flashTimer = useRef<number>();
  /** grading request failed: the server's HTTP status, or none for a network error */
  const [submitError, setSubmitError] = useState<{ status?: number } | null>(null);
  const exam = isExam(item) ? item : null;
  const [reportOpen, setReportOpen] = useState(false);
  const endsAt = exam ? examEndsAt(attempt, exam.meta.durationMinutes) : 0;
  // exam papers: practice / exam is chosen before an attempt (#65), after time ran out while away (#70),
  // and when switching mid-attempt (#66)
  const [modeDialog, setModeDialog] = useState<ModeReason | null>(() => {
    if (!exam || attempt.status === 'submitted') return null;
    if (!attempt.mode) return 'new';
    if (attempt.mode === 'exam' && Date.now() >= endsAt) return 'timeout';
    return null;
  });
  const [switchOpen, setSwitchOpen] = useState(false);
  // listening exam: the recording is the clock — when time is up while it still plays, hand in when it ends (#109)
  const [examAudioPlaying, setExamAudioPlaying] = useState(false);
  const [submitAfterAudio, setSubmitAfterAudio] = useState(false);

  const submitted = attempt.status === 'submitted' && !!attempt.result;
  const result = attempt.result as Result | null;
  const review = submitted && key && result ? { key, result } : null;
  const responses = attempt.responses as Responses;

  // load the key when reviewing an attempt submitted earlier
  useEffect(() => {
    if (submitted && !key) staticContent.getKey(item, responses).then(setKey);
  }, [submitted, key, item]);

  const persist = useCallback(
    (a: AttemptT) => {
      setAttempt(a);
      localAttempts.save(a);
    },
    [],
  );

  const setResponses = useCallback(
    (update: (prev: Responses) => Responses) => {
      setAttempt((prev) => {
        if (prev.status === 'submitted') return prev;
        const next = { ...prev, responses: update(prev.responses as Responses) };
        localAttempts.save(next);
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    if (flat[index]) localAttempts.setPosition(item.id, pageKey(flat[index]));
  }, [item.id, index]);

  const elapsed = () => attempt.durationSec + (Date.now() - sessionStart.current) / 1000;

  const submit = async () => {
    if (attempt.status === 'submitted') return;
    setConfirmOpen(false);
    setSubmitError(null);
    let graded: Awaited<ReturnType<typeof staticContent.grade>>;
    try {
      graded = await staticContent.grade(item, responses);
    } catch (e) {
      // fetch rejects (TypeError) only when the request never reached a server
      setSubmitError({ status: (e as { status?: number }).status });
      return;
    }
    setKey(graded.key);
    const submitted: AttemptT = {
      ...attempt,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      durationSec: Math.round(elapsed()),
      result: graded.result,
    };
    persist(submitted);
    setIndex(0);
    setTab('questions');
    if (exam) setReportOpen(true);
    void runJudge(submitted);
  };
  useEffect(() => {
    if (submitAfterAudio && !examAudioPlaying && attempt.mode === 'exam' && attempt.status !== 'submitted') void submit();
  }, [submitAfterAudio, examAudioPlaying]); // eslint-disable-line react-hooks/exhaustive-deps


  /**
   * exam papers: start in practice or timed exam mode. An exam always starts from a clean sheet and the clock
   * starts now; practice keeps the answers already given (a timed-out or stopped exam continues as practice, #70 #66).
   */
  const startMode = (mode: 'practice' | 'exam') => {
    setModeDialog(null);
    setSwitchOpen(false);
    setSubmitAfterAudio(false);
    sessionStart.current = Date.now();
    const fresh = mode === 'exam' || attempt.status === 'submitted';
    const base = fresh ? newAttempt(item.id, item.status.version) : attempt;
    if (fresh) {
      localAttempts.clear(item.id);
      setKey(null);
      setIndex(0);
      setReportOpen(false);
    }
    persist({ ...base, mode, startedAt: new Date().toISOString(), durationSec: fresh ? 0 : base.durationSec, played: fresh ? [] : base.played });
  };
  /** closing the mode dialog: back to the review of a finished attempt, else back to the playlist (#65) */
  const cancelMode = () => {
    if (modeDialog === 'retry') setModeDialog(null);
    else navigate(`/p/${item.playlistId}`);
  };
  const examMode = !!exam && attempt.mode === 'exam' && !submitted && modeDialog !== 'timeout';
  const toggleFlag = (qid: string) => {
    const flagged = attempt.flagged ?? [];
    persist({ ...attempt, flagged: flagged.includes(qid) ? flagged.filter((f) => f !== qid) : [...flagged, qid] });
  };
  const played = useMemo(() => new Set(attempt.played ?? []), [attempt.played]);
  const markPlayed = (sectionId: string) =>
    setAttempt((prev) => {
      const next = { ...prev, played: [...new Set([...(prev.played ?? []), sectionId])] };
      localAttempts.save(next);
      return next;
    });

  /** score constructed responses with the LLM judge; questions it can't judge fall back to self-assessment */
  const runJudge = async (a: AttemptT) => {
    const pending = (a.result?.byQuestion ?? []).filter((b) => b.scoredBy === 'pending').map((b) => b.q);
    if (!pending.length) return;
    const verdicts = await Promise.all(
      pending.map((qid) =>
        staticContent.judge
          ? staticContent.judge
              .judge({ itemId: item.id, itemVersion: item.status.version, questionId: qid, response: responseText(a.responses[qid]) })
              .then((j) => ({ qid, j }), () => ({ qid, j: null }))
          : Promise.resolve({ qid, j: null }),
      ),
    );
    setAttempt((prev) => {
      if (prev.attemptId !== a.attemptId || !prev.result) return prev;
      let r = prev.result as Result;
      verdicts.forEach(({ qid, j }) => (r = j ? applyJudgement(r, qid, j) : r));
      r = fallbackToSelf(r, verdicts.filter((v) => !v.j).map((v) => v.qid));
      const next = { ...prev, result: r };
      localAttempts.save(next);
      return next;
    });
  };

  // an attempt reloaded while the judge was still running: judge again
  useEffect(() => {
    if (submitted && attempt.result?.byQuestion.some((b) => b.scoredBy === 'pending')) void runJudge(attempt);
  }, [attempt.attemptId]); // eslint-disable-line react-hooks/exhaustive-deps

  const retry = () => {
    if (exam) return setModeDialog('retry');
    localAttempts.clear(item.id);
    sessionStart.current = Date.now();
    setAttempt(newAttempt(item.id, item.status.version));
    setKey(null);
    setIndex(0);
    setReportOpen(false);
  };

  // save elapsed time when leaving mid-attempt
  useEffect(
    () => () => {
      const a = localAttempts.get(item.id);
      if (a && a.status === 'in_progress') {
        localAttempts.save({ ...a, durationSec: Math.round(a.durationSec + (Date.now() - sessionStart.current) / 1000) });
      }
    },
    [item.id],
  );

  const unanswered = flat.filter((f) => !pageAnswered(f, responses));
  const current = flat[index];
  // exam pages with nothing for the left pane (speaking Part 1, writing Part 6): the questions take the full width (#78)
  const soloQuestions =
    !!exam && exam.paper !== 'listening' && !!current && !current.section.material?.length && !current.q.material?.length;
  // narrow screens: a page with only questions counts as the 题目 tab, so the next page with material keeps the questions in view
  useEffect(() => {
    if (soloQuestions) setTab('questions');
  }, [soloQuestions]);

  const visible = useMemo(() => flat.map((f) => f.index), [flat]);

  const go = (i: number) => {
    setIndex(i);
    // bring the related blank / evidence into view in the article
    requestAnimationFrame(() => {
      const f = flat[i];
      const root = articleRef.current;
      if (!root || !f) return;
      const blank = root.querySelector<HTMLElement>(`[data-blank-q="${f.q.id}"]`);
      const ev = review?.key.answers[f.q.id]?.evidence?.[0]?.block;
      const target = blank ?? (ev ? root.querySelector<HTMLElement>(`[data-block="${ev}"]`) : null);
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  /** one-page Parts: the evidence of the question whose 定位原文 was tapped (#100) */
  const [picked, setPicked] = useState<{ block: string; quote: string } | null>(null);

  /** scroll to the evidence sentence and flash it (falls back to the whole block) */
  const locate = (blockId: string, quote?: string) => {
    setTab('article');
    if (flat[index]?.group) setPicked({ block: blockId, quote: quote ?? '' });
    requestAnimationFrame(() => {
      const el = articleRef.current?.querySelector<HTMLElement>(`[data-block="${blockId}"]`);
      if (!el) return;
      const range = quote ? sentenceRange(el, quote) : null;
      const anchor = range?.startContainer.parentElement ?? el;
      anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (range && 'highlights' in CSS) {
        paint('flash', [range]);
        window.clearTimeout(flashTimer.current);
        flashTimer.current = window.setTimeout(() => paint('flash', []), 1400);
        return;
      }
      el.classList.remove('flash');
      void el.offsetWidth;
      el.classList.add('flash');
    });
  };

  // keyboard: ←/→ to change question
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return;
      const pos = visible.indexOf(index);
      if (e.key === 'ArrowRight' && pos < visible.length - 1) go(visible[pos + 1]);
      if (e.key === 'ArrowLeft' && pos > 0) go(visible[pos - 1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /** blanks inside the article: show the current answer, jump to the owning question when tapped */
  const renderBlank = (n: BlankNode) => {
    const qi = owners.get(n.id);
    const fq = qi !== undefined ? flat[qi] : undefined;
    const text = blankText(fq, n.id, responses);
    const ok = review ? blankCorrect(review.result, fq, n.id) : null;
    const isActive = qi === index;
    return (
      <button
        className={`blank-chip ${text ? 'is-filled' : ''} ${isActive ? 'is-active' : ''} ${ok === true ? 'is-correct' : ok === false ? 'is-wrong' : ''}`}
        data-blank-q={fq?.q.id}
        onClick={() => {
          if (qi === undefined) return;
          go(qi);
          setTab('questions');
        }}
        aria-label={`${t('interaction.blankN', { n: n.number ?? '' })}${text ? t('reader.blankText', { text }) : t('interaction.slotEmpty')}`}
      >
        {text && <span className="blank-chip-num">{n.number}</span>}
        {showFirstLetter(n.hint?.firstLetter, text) && <span className="blank-chip-hint">{n.hint!.firstLetter}</span>}
        {text ? <span className="blank-chip-text">{text}</span> : <span className="blank-chip-empty">{n.number ?? '\u00a0'}</span>}
        {ok === false && fq && review && (
          <span className="blank-chip-correct">{correctBlankText(fq, n.id, review.key)?.replace(/^[A-Z]\. /, '')}</span>
        )}
        {n.hint?.baseWord && <span className="blank-chip-base">({n.hint.baseWord})</span>}
      </button>
    );
  };

  // a choose-one page (PET Writing Part 2) stands for the task the learner picked (scored), else the first task
  const page =
    current?.choose
      ? {
          ...current,
          q:
            current.section.questions.find((q) =>
              review ? review.result.byQuestion.some((b) => b.q === q.id && b.scoredBy !== 'none') : pageAnswered({ ...current, q, choose: undefined }, responses),
            ) ?? current.q,
        }
      : current;
  const iprops: InteractionProps | null = page
    ? { item, fq: page, flat, owners, responses, setResponses, review, onLocate: locate, examMode }
    : null;

  const pos = visible.indexOf(index);
  const isLast = pos === visible.length - 1;
  // a Part answered on one page highlights nothing until one question's 定位原文 is tapped, then only that
  // question's evidence (#92 #100); a single question highlights its own evidence
  useEffect(() => setPicked(null), [current?.q.id]);
  const evidence = useMemo(
    () => (!review || !current ? [] : current.group ? (picked ? [picked] : []) : evidenceOf(review.key, current.q.id)),
    [review?.key, current?.q.id, picked], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div className={`reader-body tab-${tab} ${soloQuestions ? 'no-left' : ''}`}>
      <div className="reader-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'article'} className={tab === 'article' ? 'is-active' : ''} onClick={() => setTab('article')}>
          {exam ? t('reader.tabMaterial') : t('reader.tabArticle')}
        </button>
        <button role="tab" aria-selected={tab === 'questions'} className={tab === 'questions' ? 'is-active' : ''} onClick={() => setTab('questions')}>
          {t('reader.tabQuestions', { progress: submitted ? '' : `${flat.length - unanswered.length}/${flat.length}` })}
        </button>
      </div>

      <section className="reader-left">
        {exam ? (
          <ExamPane
            ref={articleRef}
            item={exam}
            fq={current}
            renderBlank={renderBlank}
            evidence={evidence}
            transcripts={review?.key.transcripts}
            locked={examMode}
            played={played}
            onPlayed={markPlayed}
            onPlayingChange={setExamAudioPlaying}
          />
        ) : (
          !isExam(item) && <ArticlePane ref={articleRef} item={item} renderBlank={renderBlank} evidence={evidence} />
        )}
      </section>

      <section className="reader-right">
        <div className="question-card">
          {headSlot &&
            exam &&
            attempt.mode &&
            !submitted &&
            !modeDialog &&
            createPortal(
              <ModeSelect
                mode={attempt.mode}
                timer={
                  examMode ? (
                    <ExamTimer
                      endsAt={endsAt}
                      waitingForAudio={submitAfterAudio}
                      onTimeUp={() => (examAudioPlaying ? setSubmitAfterAudio(true) : void submit())}
                    />
                  ) : undefined
                }
                onSwitch={() => setSwitchOpen(true)}
              />,
              headSlot,
            )}
          {exam && ((examMode && current) || (submitted && result)) && !modeDialog && (
            <div className="exam-bar">
              {examMode && current && (
                <button
                  className={`chip flag-toggle ${attempt.flagged?.includes(current.q.id) ? 'is-on' : ''}`}
                  aria-pressed={!!attempt.flagged?.includes(current.q.id)}
                  onClick={() => toggleFlag(current.q.id)}
                >
                  {attempt.flagged?.includes(current.q.id) ? t('reader.flagged') : t('reader.flag')}
                </button>
              )}
              {submitted && result && (
                <button className="chip" onClick={() => setReportOpen(true)}>
                  {t('exam.report.title')}
                </button>
              )}
            </div>
          )}
          <div className="question-scroll thin-scroll">
            {current && iprops && (
              <>
                {current.section.instruction && (
                  <p className="section-instruction">
                    {current.section.label && <b>{current.section.label}. </b>}
                    <Emph text={current.section.instruction} />
                  </p>
                )}
                {current.section.intro && (
                  // the Part's printed lead-in belongs with the questions, not the texts (#90)
                  <p className="section-intro">
                    <Rich nodes={current.section.intro} />
                  </p>
                )}
                <QuestionBody
                  // a new attempt (重新作答, practice ↔ exam) starts every interaction fresh — e.g. no recordings kept (#77)
                  key={attempt.attemptId}
                  props={iprops}
                  selfAssessed={result?.selfAssessed?.[page!.q.id]}
                  onSelfAssess={(v) =>
                    result &&
                    persist({ ...attempt, result: { ...result, selfAssessed: { ...result.selfAssessed, [page!.q.id]: v } } })
                  }
                />
                {review &&
                  !current.group &&
                  (!EMBEDDED_EXPLAIN.has(current.q.interaction.kind) || hasImageOptions(current.q)) &&
                  // speaking: the Part's model answer once, on its last page
                  (current.q.interaction.kind !== 'speaking' || current.turn === undefined || current.turn === current.q.interaction.turns.length - 1) && (
                  <Explanation item={item} fq={page!} keyData={review.key} onLocate={locate} result={review.result} />
                )}
              </>
            )}
          </div>

          {submitError && (
            <p className="submit-error" role="alert">
              {submitError.status ? t('reader.gradeUnavailable', { status: submitError.status }) : t('reader.networkError')}
            </p>
          )}
          <nav className="question-nav" aria-label={t('reader.nav')}>
            <button className="pill-button" disabled={pos <= 0} onClick={() => go(visible[pos - 1])}>
              {t('reader.prev')}
            </button>
            <QuestionStrip current={index} count={visible.length}>
              {visible.map((i) => {
                const f = flat[i];
                // after submitting (#128): a page with judged answers (writing, speaking, a table with written cells)
                // shows score / full marks, e.g. 15/20; a Part of objective questions on one page shows right / total,
                // e.g. 3/5; a single objective question keeps the ✓ / ✗ icon
                const pageQs = f.group ? f.section.questions : f.choose ? f.section.questions : [f.q];
                const all = pageQs.map((q) => review?.result.byQuestion.find((b) => b.q === q.id)).filter((b) => b !== undefined);
                const rows = f.choose ? all.filter((b) => b.scoredBy !== 'none') : all;
                const judged = pageQs.some((q) => !isScored(q));
                const lastTurn = f.turn === undefined || f.q.interaction.kind !== 'speaking' || f.turn === f.q.interaction.turns.length - 1;
                const sum = (ns: number[]) => Math.round(ns.reduce((a, b) => a + b, 0) * 100) / 100;
                const score =
                  !review || !rows.length
                    ? undefined
                    : judged
                      ? lastTurn && rows.every((b) => b.scoredBy === 'judge' || b.scoredBy === 'auto' || b.scoredBy === undefined)
                        ? `${sum(rows.map((b) => b.points))}/${sum(rows.map((b) => b.maxPoints))}`
                        : undefined
                      : rows.length > 1
                        ? `${rows.filter((b) => b.correct === true).length}/${rows.length}`
                        : undefined;
                const single = rows.length === 1 && !judged ? rows[0] : undefined;
                const state = review
                  ? score
                    ? 'is-score'
                    : single?.correct === true
                      ? 'is-correct'
                      : single?.correct === false
                        ? 'is-wrong'
                        : 'is-neutral'
                  : pageAnswered(f, responses)
                    ? 'is-answered'
                    : '';
                return (
                  <button
                    key={i}
                    className={`question-dot ${i === index ? 'is-current' : ''} ${state} ${examMode && attempt.flagged?.includes(f.q.id) ? 'is-flagged' : ''} ${exam && f.firstInSection ? 'part-start' : ''}`}
                    // exam papers: the first number of each Part carries the Part's label (GitHub #72)
                    data-part={exam && f.firstInSection ? `P${f.section.part ?? ''}` : undefined}
                    onClick={() => go(i)}
                    aria-label={t('reader.dotLabel', {
                      part: exam && f.section.part ? t('reader.partPrefix', { part: f.section.part }) : '',
                      n: `${f.display}${f.displayTo && f.displayTo !== f.display ? `–${f.displayTo}` : ''}`,
                      state: score ? t('reader.dotScore', { score }) : state === 'is-correct' ? t('reader.dotCorrect') : state === 'is-wrong' ? t('reader.dotWrong') : state === 'is-answered' ? t('reader.dotAnswered') : '',
                    })}
                    aria-current={i === index}
                  >
                    {score ? (
                      <span className="question-dot-num is-score">{score}</span>
                    ) : state === 'is-correct' || state === 'is-wrong' ? (
                      <img className="question-dot-icon" src={state === 'is-correct' ? correctIcon : wrongIcon} alt="" />
                    ) : (
                      <>
                        <span className={`question-dot-num ${f.displayTo && !tablePage(f) ? 'is-range' : ''}`}>
                          {tablePage(f) ?? (
                            <>
                              {f.display}
                              {f.displayTo && f.displayTo !== f.display ? `–${f.displayTo}` : ''}
                            </>
                          )}
                        </span>
                        {!review && <span className="question-dot-mark" aria-hidden />}
                      </>
                    )}
                  </button>
                );
              })}
            </QuestionStrip>
            {submitted ? (
              isLast ? (
                <button className="pill-button" onClick={retry}>
                  {t('reader.retry')}
                </button>
              ) : (
                <button className="pill-button" onClick={() => go(visible[pos + 1])}>
                  {t('reader.next')}
                </button>
              )
            ) : isLast ? (
              <button
                className={`pill-button primary ${unanswered.length ? 'is-dim' : ''}`}
                onClick={() => (unanswered.length ? setConfirmOpen(true) : submit())}
              >
                {t('reader.submit')}
              </button>
            ) : (
              <button className="pill-button" onClick={() => go(visible[pos + 1])}>
                {t('reader.next')}
              </button>
            )}
          </nav>
        </div>
      </section>

      {exam && modeDialog && <ModeDialog item={exam} reason={modeDialog} onChoose={startMode} onCancel={cancelMode} />}
      {exam && switchOpen && attempt.mode && (
        <SwitchModeDialog from={attempt.mode} answered={Object.keys(attempt.responses).length} onConfirm={() => startMode(attempt.mode === 'exam' ? 'practice' : 'exam')} onCancel={() => setSwitchOpen(false)} />
      )}
      {exam && reportOpen && result && <ExamReport item={exam} result={result} onClose={() => setReportOpen(false)} />}
      {confirmOpen && (
        <div className="dialog-backdrop" role="presentation" onClick={() => setConfirmOpen(false)}>
          <div className="dialog" role="dialog" aria-modal aria-labelledby="dlg-title" onClick={(e) => e.stopPropagation()}>
            <h2 id="dlg-title">{t('reader.unansweredTitle', { count: unanswered.length })}</h2>
            <p>{t('reader.unansweredHint')}</p>
            <div className="dialog-dots">
              {unanswered.map((f) => (
                <button
                  key={f.q.id}
                  className="question-dot"
                  aria-label={t('reader.questionN', { n: f.display })}
                  onClick={() => {
                    setConfirmOpen(false);
                    go(f.index);
                    setTab('questions');
                  }}
                >
                  <span className="question-dot-num">{f.display}</span>
                </button>
              ))}
            </div>
            <div className="dialog-actions">
              <button className="pill-button" onClick={submit}>
                {t('reader.submitAnyway')}
              </button>
              <button className="pill-button primary" autoFocus onClick={() => setConfirmOpen(false)}>
                {t('reader.keepAnswering')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** kinds whose explanation is shown inside the correct option (Figma Option-text-item, correct-expanded) */
const EMBEDDED_EXPLAIN = new Set(['choice', 'inlineChoice']);

/** a table answered on one page (section.view "table", #127) is one Part in the pager: P1, P2 … */
const tablePage = (f: ReturnType<typeof flatten>[number]) =>
  f.group && f.section.view === 'table' ? `P${f.section.part ?? f.section.id.slice(1)}` : undefined;

function QuestionBody({
  props,
  selfAssessed,
  onSelfAssess,
}: {
  props: InteractionProps;
  selfAssessed?: boolean;
  onSelfAssess: (v: boolean) => void;
}) {
  if (props.fq.choose) return <ChooseTaskView {...props} selfAssessed={selfAssessed} onSelfAssess={onSelfAssess} />;
  if (props.fq.group)
    return props.fq.section.view === 'match' ? <MatchBoardView {...props} /> : props.fq.section.view === 'table' ? <SectionTableView {...props} /> : <SectionAllView {...props} />;
  switch (props.fq.q.interaction.kind) {
    case 'choice':
      return <ChoiceView {...props} />;
    case 'inlineChoice':
      return <InlineChoiceView {...props} />;
    case 'gapMatch':
      return <GapMatchView key={props.fq.q.id} {...props} />;
    case 'textEntry':
      return <TextEntryView key={props.fq.q.id} {...props} />;
    case 'match':
      return <MatchView key={props.fq.q.id} {...props} />;
    case 'extendedText':
      return <ExtendedTextView {...props} selfAssessed={selfAssessed} onSelfAssess={onSelfAssess} />;
    case 'order':
      return <OrderView {...props} />;
    case 'speaking':
      return <SpeakingView key={props.fq.q.id} {...props} />;
  }
}

/** resume point: the question id, plus the turn for a speaking page ("q1:3") */
const pageKey = (f: { q: { id: string }; turn?: number }) => (f.turn === undefined ? f.q.id : `${f.q.id}:${f.turn}`);

/** what the judge receives: the text answer, or a speaking task's {turnId: transcript} as JSON */
const responseText = (r: unknown) => (typeof r === 'string' ? r : r && typeof r === 'object' ? JSON.stringify(r) : '');

function Explanation({
  fq,
  keyData,
  onLocate,
  result,
}: {
  item: ItemT;
  fq: ReturnType<typeof flatten>[number];
  keyData: ItemKeyT;
  onLocate: (block: string, quote?: string) => void;
  result: Result;
}) {
  const { t } = useTranslation();
  const k = keyData.answers[fq.q.id];
  if (!k) return null;
  const row = result.byQuestion.find((b) => b.q === fq.q.id);
  const scored = row?.scoredBy === 'judge' && scoreOnly(keyData, fq.q.id);
  const r = row && scored ? { ...row, correct: null } : row;
  const it = fq.q.interaction;
  let answerText = '';
  if ('correct' in k) {
    if (it.kind === 'gapMatch') {
      answerText = k.correct
        .map((id) => {
          const e = fq.section.bank?.find((b) => b.id === id);
          return e ? `${id}. ${plainText(e.content)}` : id;
        })
        .join(t('reader.answerSep'));
    } else if ('options' in it) {
      answerText = k.correct
        .map((id) => {
          const o = it.options.find((x) => x.id === id);
          return it.kind === 'choice' && it.variant === 'trueFalse' ? (id === 'T' ? 'True' : 'False') : o ? `${id}. ${plainText(o.content)}` : id;
        })
        .join(t('reader.answerSep'));
    }
  } else if ('slots' in k) {
    answerText = Object.values(k.slots)
      .map((s) => s.accept.join(' / '))
      .join(t('reader.answerSep'));
  } else if ('pairs' in k) {
    answerText = Object.entries(k.pairs)
      .map(([l, rr]) => `${l}–${rr}`)
      .join(t('reader.pairSep'));
  } else if ('sampleAnswer' in k) {
    answerText = k.sampleAnswer;
  } else if (('sequence' in k || 'sequences' in k) && it.kind === 'order') {
    const seqs = 'sequence' in k ? [k.sequence] : k.sequences;
    answerText = seqs.map((seq) => orderSentence(it.items, seq, it.ending)).join(' / ');
  }
  const isSample = 'sampleAnswer' in k;
  return (
    <div className={`explain ${r?.correct === true ? 'is-correct' : r?.correct === false ? 'is-wrong' : ''}`}>
      <div className="explain-head">
        {r?.correct === true && (
          <>
            <Check /> {t('reader.correct')}
          </>
        )}
        {r?.correct === false && (
          <>
            <Cross /> {r.points > 0 ? t('reader.partlyCorrect', { points: Math.round(r.points * 100) / 100, max: r.maxPoints }) : t('reader.wrong')}
          </>
        )}
        {r?.correct === null && <>{scored ? t('reader.scored', { points: r.points, max: r.maxPoints }) : t('reader.sampleAnswer')}</>}
      </div>
      <p className="explain-answer">
        <span className="explain-label">{isSample ? t('reader.sampleAnswer') : t('reader.correctAnswer')}</span>
        {answerText}
      </p>
      {/* many rubrics already begin with 要点： / 要点1： (#98) — add the label only when it is missing */}
      {'rubricZh' in k && k.rubricZh && <p className="explain-text">{/^要点/.test(k.rubricZh) ? k.rubricZh : t('reader.keyPoints', { text: k.rubricZh })}</p>}
      {k.explanationZh && <p className="explain-text">{k.explanationZh}</p>}
      {k.tipsZh && <p className="explain-text explain-tip">{t('reader.tips', { text: k.tipsZh })}</p>}
      {k.evidence?.[0] && (
        <button className="chip" onClick={() => onLocate(k.evidence![0].block, k.evidence![0].quote)}>
          <Locate /> {t('reader.locate')}
        </button>
      )}
    </div>
  );
}

export { isScored };
