import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isExam, isVocabDay, type AnyItemT, type AttemptT, type ItemKeyT, type ItemT } from '@schema';
import { staticContent } from '@/lib/content';
import { localAttempts, newAttempt } from '@/lib/storage';
import { isScored, type Result } from '@/lib/grading';
import { applyJudgement, fallbackToSelf } from '@/lib/judge';
import { BackArrow, Locate } from '@/components/Icons';
import Loading from '@/components/Loading';
import { Rich, plainText, type BlankNode } from '@/components/Rich';
import { ArticlePane } from './ArticlePane';
import { ExamPane } from './ExamPane';
import { ExamReport, ExamTimer, ModeDialog, ModeSelect, SwitchModeDialog, type ModeReason } from './ExamChrome';
import { examEndsAt } from '@/lib/exam-status';
import { SpeakingView } from './Speaking';
import { MatchBoardView, SectionAllView } from './PartViews';
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
import { blankCorrect, blankOwners, blankText, correctBlankText, evidenceOf, flatten, pageAnswered, showFirstLetter, type Responses } from './model';
import OverflowTip from '@/components/OverflowTip';
import { VocabDayPage } from '@/vocab/VocabDayPage';
import { Panel } from '@/ui/common/Panel/Panel';
import { Chip } from '@/ui/common/Chip/Chip';
import { Dialog } from '@/ui/common/Dialog/Dialog';
import { InlineNotice } from '@/ui/common/InlineNotice/InlineNotice';
import { SegmentedTabs } from '@/ui/SegmentedTabs/SegmentedTabs';
import { Highlight } from '@/ui/Highlight/Highlight';
import { QuizButton } from '@/ui/QuizButton/QuizButton';
import { QuestionNav } from '@/ui/quiz/QuestionNav/QuestionNav';
import { PartPager } from '@/ui/quiz/PartPager/PartPager';
import { AnswerExplain, AnswerFeedback } from '@/ui/quiz/AnswerFeedback/AnswerFeedback';

export function ReaderPage() {
  const { playlistId = '', itemId = '' } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [item, setItem] = useState<AnyItemT | null>(null);
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
        <OverflowTip className="reader-head-title">
          {item && isVocabDay(item) ? t('vocab.dayTitle', { n: item.day, range: item.title }) : (item?.title ?? '')}
        </OverflowTip>
        <div className="reader-head-actions" ref={setHeadSlot} />
      </header>
      {error && <p className="error">{t('common.loadFailed', { message: error })}</p>}
      {!item && !error && <Loading />}
      {item &&
        (isVocabDay(item) ? (
          <VocabDayPage key={item.id} item={item} headSlot={headSlot} />
        ) : (
          <Reader key={item.id} item={item} headSlot={headSlot} />
        ))}
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
      Highlight.flash(el);
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
      <SegmentedTabs<Tab>
        className="reader-tabs"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'article', label: exam ? t('reader.tabMaterial') : t('reader.tabArticle') },
          { id: 'questions', label: t('reader.tabQuestions', { progress: submitted ? '' : `${flat.length - unanswered.length}/${flat.length}` }) },
        ]}
      />

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
        <Panel
          kind="quiz"
          header={
            <>
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
                    <Chip
                      tone={attempt.flagged?.includes(current.q.id) ? 'on' : 'neutral'}
                      className="flag-toggle"
                      aria-pressed={!!attempt.flagged?.includes(current.q.id)}
                      onClick={() => toggleFlag(current.q.id)}
                    >
                      {attempt.flagged?.includes(current.q.id) ? t('reader.flagged') : t('reader.flag')}
                    </Chip>
                  )}
                  {submitted && result && (
                    <Chip onClick={() => setReportOpen(true)}>{t('exam.report.title')}</Chip>
                  )}
                </div>
              )}
            </>
          }
          footer={
            <>
              {submitError && (
                <InlineNotice tone="danger" role="alert">
                  {submitError.status ? t('reader.gradeUnavailable', { status: submitError.status }) : t('reader.networkError')}
                </InlineNotice>
              )}
              <QuestionNav
                label={t('reader.nav')}
                current={index}
                count={visible.length}
                prev={
                  <QuizButton disabled={pos <= 0} onClick={() => go(visible[pos - 1])}>
                    {t('reader.prev')}
                  </QuizButton>
                }
                action={
                  submitted ? (
                    isLast ? (
                      <QuizButton onClick={retry}>{t('reader.retry')}</QuizButton>
                    ) : (
                      <QuizButton onClick={() => go(visible[pos + 1])}>{t('reader.next')}</QuizButton>
                    )
                  ) : isLast ? (
                    <QuizButton variant="primary" dim={unanswered.length > 0} onClick={() => (unanswered.length ? setConfirmOpen(true) : submit())}>
                      {t('reader.submit')}
                    </QuizButton>
                  ) : (
                    <QuizButton onClick={() => go(visible[pos + 1])}>{t('reader.next')}</QuizButton>
                  )
                }
              >
                {visible.map((i) => {
                  const f = flat[i];
                  // a group page (a whole Part on one page) is correct only when all its questions are
                  const rows = (f.group ? f.section.questions : [f.q]).map((q) => review?.result.byQuestion.find((b) => b.q === q.id));
                  const r = rows.length === 1 ? rows[0] : { correct: rows.some((x) => x?.correct === false) ? false : rows.every((x) => x?.correct === true) ? true : null };
                  const res = !review ? 'none' : r?.correct === true ? 'correct' : r?.correct === false ? 'wrong' : 'none';
                  const answered = !review && pageAnswered(f, responses);
                  const range = `${f.display}${f.displayTo && f.displayTo !== f.display ? `–${f.displayTo}` : ''}`;
                  return (
                    <PartPager
                      key={i}
                      layout="question"
                      // exam papers: the first number of each Part carries the Part's label (GitHub #72)
                      kicker={exam && f.firstInSection ? `P${f.section.part ?? ''}` : undefined}
                      label={range}
                      labelKind={f.displayTo ? 'range' : 'number'}
                      selected={i === index}
                      completed={answered}
                      result={res}
                      reviewing={!!review}
                      flagged={examMode && !!attempt.flagged?.includes(f.q.id)}
                      onClick={() => go(i)}
                      ariaLabel={t('reader.dotLabel', {
                        part: exam && f.section.part ? t('reader.partPrefix', { part: f.section.part }) : '',
                        n: range,
                        state: res === 'correct' ? t('reader.dotCorrect') : res === 'wrong' ? t('reader.dotWrong') : answered ? t('reader.dotAnswered') : '',
                      })}
                    />
                  );
                })}
              </QuestionNav>
            </>
          }
        >
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
        </Panel>
      </section>

      {exam && modeDialog && <ModeDialog item={exam} reason={modeDialog} onChoose={startMode} onCancel={cancelMode} />}
      {exam && switchOpen && attempt.mode && (
        <SwitchModeDialog from={attempt.mode} answered={Object.keys(attempt.responses).length} onConfirm={() => startMode(attempt.mode === 'exam' ? 'practice' : 'exam')} onCancel={() => setSwitchOpen(false)} />
      )}
      {exam && reportOpen && result && <ExamReport item={exam} result={result} onClose={() => setReportOpen(false)} />}
      {confirmOpen && (
        <Dialog
          title={t('reader.unansweredTitle', { count: unanswered.length })}
          onClose={() => setConfirmOpen(false)}
          actions={
            <>
              <QuizButton onClick={submit}>{t('reader.submitAnyway')}</QuizButton>
              <QuizButton variant="primary" autoFocus onClick={() => setConfirmOpen(false)}>
                {t('reader.keepAnswering')}
              </QuizButton>
            </>
          }
        >
          <p>{t('reader.unansweredHint')}</p>
          <div className="dialog-dots">
            {unanswered.map((f) => (
              <PartPager
                key={f.q.id}
                layout="question"
                tone="pending"
                label={String(f.display)}
                labelKind="number"
                ariaLabel={t('reader.questionN', { n: f.display })}
                onClick={() => {
                  setConfirmOpen(false);
                  go(f.index);
                  setTab('questions');
                }}
              />
            ))}
          </div>
        </Dialog>
      )}
    </div>
  );
}

/** kinds whose explanation is shown inside the correct option (Figma Option-text-item, correct-expanded) */
const EMBEDDED_EXPLAIN = new Set(['choice', 'inlineChoice']);

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
  if (props.fq.group) return props.fq.section.view === 'match' ? <MatchBoardView {...props} /> : <SectionAllView {...props} />;
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
  const r = result.byQuestion.find((b) => b.q === fq.q.id);
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
  const ev = k.evidence?.[0];
  return (
    <AnswerFeedback
      variant="block"
      result={r?.correct === true ? 'correct' : r?.correct === false ? (r.points > 0 ? 'partial' : 'wrong') : 'none'}
      head={
        r?.correct === true
          ? t('reader.correct')
          : r?.correct === false
            ? r.points > 0
              ? t('reader.partlyCorrect', { points: Math.round(r.points * 100) / 100, max: r.maxPoints })
              : t('reader.wrong')
            : r?.correct === null
              ? t('reader.sampleAnswer')
              : undefined
      }
      label={isSample ? t('reader.sampleAnswer') : t('reader.correctAnswer')}
      answer={answerText}
      action={
        ev && (
          <Chip icon={<Locate />} onClick={() => onLocate(ev.block, ev.quote)}>
            {t('reader.locate')}
          </Chip>
        )
      }
    >
      {/* many rubrics already begin with 要点： / 要点1： (#98) — add the label only when it is missing */}
      {'rubricZh' in k && k.rubricZh && (
        <AnswerExplain variant="block">{/^要点/.test(k.rubricZh) ? k.rubricZh : t('reader.keyPoints', { text: k.rubricZh })}</AnswerExplain>
      )}
      {k.explanationZh && <AnswerExplain variant="block">{k.explanationZh}</AnswerExplain>}
      {k.tipsZh && (
        <AnswerExplain variant="block" tip>
          {t('reader.tips', { text: k.tipsZh })}
        </AnswerExplain>
      )}
    </AnswerFeedback>
  );
}

export { isScored };
