import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isExam, isVocabDay, type AnyItemT, type AttemptT, type ItemKeyT, type ItemT } from '@schema';
import { staticContent } from '@/lib/content';
import { localAttempts, newAttempt } from '@/lib/storage';
import { isAnswered, isScored, type Result } from '@/lib/grading';
import { applyJudgement, emptyJudgement, fallbackToSelf, isBlankResponse, isCambridge, retryUnjudged } from '@/lib/judge';
import { BackArrow, Locate } from '@/components/Icons';
import Loading from '@/components/Loading';
import { Rich, plainText, type BlankNode } from '@/components/Rich';
import { ArticlePane } from './ArticlePane';
import { ExamPane } from './ExamPane';
import { ExamReport, ExamTimer, ModeDialog, ModeSelect, SwitchModeDialog, type ModeReason } from './ExamChrome';
import { examEndsAt } from '@/lib/exam-status';
import { SpeakingView } from './Speaking';
import { MatchBoardView, SectionAllView, SectionTableView } from './PartViews';
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
import { blankCorrect, blankOwners, blankText, correctBlankText, evidenceOf, flatten, numberedProgress, pageAnswered, scoreOnly, showFirstLetter, type Responses } from './model';
import OverflowTip from '@/components/OverflowTip';
import { VocabDayPage } from '@/vocab/VocabDayPage';
import { Panel } from '@/ui/common/Panel/Panel';
import { Chip } from '@/ui/common/Chip/Chip';
import { scrollBehavior, scrollRangeIntoView } from '@/lib/scroll';
import { Dialog } from '@/ui/common/Dialog/Dialog';
import { LoadError } from '@/components/LoadError';
import FittyText from '@/components/FittyText';
import { Message } from '@/ui/Message/Message';
import { SegmentedTabs } from '@/ui/SegmentedTabs/SegmentedTabs';
import { Highlight } from '@/ui/Highlight/Highlight';
import { QuizButton } from '@/ui/QuizButton/QuizButton';
import { QuestionNav } from '@/ui/quiz/QuestionNav/QuestionNav';
import type { NavAction } from '@/ui/quiz/QuestionNav/NavButton';
import { PartNav, type PartNavPart, type PartQuestionState } from '@/ui/vocab/PartNav/PartNav';
import { FlagToggle } from '@/ui/quiz/FlagToggle/FlagToggle';
import { PartPager } from '@/ui/quiz/PartPager/PartPager';
import { AnswerExplain, AnswerFeedback } from '@/ui/quiz/AnswerFeedback/AnswerFeedback';

export function ReaderPage() {
  const { playlistId = '', itemId = '' } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [item, setItem] = useState<AnyItemT | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loadTry, setLoadTry] = useState(0);
  // header slot for the reader's own controls (exam mode select, #102)
  const [headSlot, setHeadSlot] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    setItem(null);
    setError(null);
    staticContent.getItem(itemId).then(setItem, (e: Error) => setError(e));
  }, [itemId, loadTry]);

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
      {error && (
        <LoadError
          error={error}
          back={{ label: t('reader.backToPlaylist'), onClick: () => navigate(`/p/${playlistId}`) }}
          onRetry={() => setLoadTry((n) => n + 1)}
        />
      )}
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
  // the page shown right now, readable after an await (submit: the learner may tap a number while it is being graded)
  const indexNow = useRef(index);
  indexNow.current = index;
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
    // a listening exam whose time ran out while its recording was playing (then reloaded): the recording is the
    // clock (#109) — continue it and hand in when it ends, rather than discarding the attempt as timed out
    if (attempt.mode === 'exam' && Date.now() >= endsAt && !(exam.paper === 'listening' && attempt.listening)) return 'timeout';
    return null;
  });
  const [switchOpen, setSwitchOpen] = useState(false);
  // listening exam: the recording is the clock — when time is up while it still plays, hand in when it ends (#109)
  const [examAudioPlaying, setExamAudioPlaying] = useState(false);
  const [submitAfterAudio, setSubmitAfterAudio] = useState(
    () => !!exam && exam.paper === 'listening' && attempt.mode === 'exam' && attempt.status !== 'submitted' && !!attempt.listening && Date.now() >= endsAt,
  );

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
    const pageAtSubmit = indexNow.current;
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
    // the review starts at the first page — unless the learner already tapped another number while it was being graded
    // (on a real network the grading takes a moment; jumping back would undo their tap)
    if (indexNow.current === pageAtSubmit) setIndex(0);
    setTab('questions');
    if (exam) setReportOpen(true);
    void runJudge(submitted);
  };
  useEffect(() => {
    // a recording still waiting to be continued after a reload (attempt.listening) is not over yet
    if (submitAfterAudio && !examAudioPlaying && !attempt.listening && attempt.mode === 'exam' && attempt.status !== 'submitted') void submit();
  }, [submitAfterAudio, examAudioPlaying, !!attempt.listening]); // eslint-disable-line react-hooks/exhaustive-deps


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
    persist({
      ...base,
      mode,
      startedAt: new Date().toISOString(),
      durationSec: fresh ? 0 : base.durationSec,
      played: fresh ? [] : base.played,
      listening: fresh ? undefined : base.listening,
    });
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
      const next = { ...prev, played: [...new Set([...(prev.played ?? []), sectionId])], listening: undefined };
      localAttempts.save(next);
      return next;
    });
  /** exam mode: how far the playing recording has got, so a reload continues it instead of replaying it */
  const markListening = (section: string, at: number) =>
    setAttempt((prev) => {
      if (prev.played?.includes(section)) return prev;
      const next = { ...prev, listening: { section, at } };
      localAttempts.save(next);
      return next;
    });

  /** score constructed responses with the LLM judge; questions it can't judge fall back to self-assessment */
  const runJudge = async (a: AttemptT) => {
    const pending = (a.result?.byQuestion ?? []).filter((b) => b.scoredBy === 'pending').map((b) => b.q);
    if (!pending.length) return;
    const max = (qid: string) => a.result?.byQuestion.find((b) => b.q === qid)?.maxPoints ?? 0;
    const verdicts = await Promise.all(
      pending.map((qid) =>
        // unanswered: 0 and 还没有作答 without asking the model (also when it is down)
        isBlankResponse(a.responses[qid])
          ? Promise.resolve({ qid, j: emptyJudgement(max(qid)) })
          : staticContent.judge
          ? staticContent.judge
              .judge({ itemId: item.id, itemVersion: item.status.version, questionId: qid, response: responseText(a.responses[qid]) })
              .then((j) => ({ qid, j }), () => ({ qid, j: null }))
          : Promise.resolve({ qid, j: null }),
      ),
    );
    const withVerdicts = (prev: AttemptT): AttemptT => {
      if (prev.attemptId !== a.attemptId || !prev.result) return prev;
      let r = prev.result as Result;
      verdicts.forEach(({ qid, j }) => (r = j ? applyJudgement(r, qid, j) : r));
      r = fallbackToSelf(r, verdicts.filter((v) => !v.j).map((v) => v.qid));
      return { ...prev, result: r };
    };
    // saved even when the learner has left the page meanwhile (no re-judging, no second bill, on the next visit)
    const stored = localAttempts.get(item.id);
    if (stored) localAttempts.save(withVerdicts(stored));
    setAttempt((prev) => {
      const next = withVerdicts(prev);
      if (next !== prev) localAttempts.save(next);
      return next;
    });
  };

  // an attempt reloaded while the judge was still running, or submitted while it was down: judge again
  // (answers it could not mark are never final zeros)
  useEffect(() => {
    if (!submitted || !attempt.result) return;
    const again = staticContent.judge ? retryUnjudged(attempt.result as Result) : null;
    if (again) {
      const next = { ...attempt, result: again };
      persist(next);
      void runJudge(next);
    } else if (attempt.result.byQuestion.some((b) => b.scoredBy === 'pending')) void runJudge(attempt);
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
  const tabProgress = numberedProgress(flat, responses);
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
      target?.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
    });
  };

  /** one-page Parts: the evidence of the question whose 定位原文 was tapped (#100) */
  const [picked, setPicked] = useState<{ block: string; quote: string } | null>(null);

  /** scroll to the evidence sentence and flash it (falls back to the whole block) */
  const locate = (blockId: string, quote?: string) => {
    setTab('article');
    setPicked({ block: blockId, quote: quote ?? '' });
    requestAnimationFrame(() => {
      const el = articleRef.current?.querySelector<HTMLElement>(`[data-block="${blockId}"]`);
      if (!el) return;
      const range = quote ? sentenceRange(el, quote) : null;
      if (range) scrollRangeIntoView(range, el);
      else el.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
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
  // nothing is highlighted until 定位原文 is tapped (Ready frames 1.05 → 1.06); then a Part answered on one page shows
  // only that question's evidence (#92 #100) and a single question all of its own evidence
  useEffect(() => setPicked(null), [current?.q.id]);
  const evidence = useMemo(
    () => (!review || !current || !picked ? [] : current.group ? [picked] : evidenceOf(review.key, current.q.id)),
    [review?.key, current?.q.id, picked], // eslint-disable-line react-hooks/exhaustive-deps
  );

  /** the pager number of one page (時文 footer; also the submit confirmation's list uses PartPager) */
  const pager = (i: number) => {
    const f = flat[i];
    // after submitting (#128): a page with judged answers (writing, speaking, a table with written cells)
    // shows score / full marks, e.g. 15/20; a Part of objective questions on one page shows right / total,
    // e.g. 3/5; a single objective question keeps the ✓ / ✗ icon. Any future scored type: score, never an icon.
    const pageQs = f.group || f.choose ? f.section.questions : [f.q];
    const all = pageQs.map((q) => review?.result.byQuestion.find((b) => b.q === q.id)).filter((b) => b !== undefined);
    const rows = f.choose ? all.filter((b) => b.scoredBy !== 'none') : all;
    const judged = pageQs.some((q) => !isScored(q));
    const lastTurn = f.turn === undefined || f.q.interaction.kind !== 'speaking' || f.turn === f.q.interaction.turns.length - 1;
    const sum = (ns: number[]) => Math.round(ns.reduce((a, b) => a + b, 0) * 100) / 100;
    const table = tablePage(f);
    const score =
      !review || !rows.length
        ? undefined
        : table
          ? // a table is marked cell by cell, ticks and written cells alike (#127): right / total once all are marked
            rows.every((b) => b.scoredBy !== 'pending' && b.correct !== null)
            ? `${rows.filter((b) => b.correct === true).length}/${rows.length}`
            : undefined
          : judged
            ? lastTurn && rows.every((b) => b.scoredBy === 'judge' || b.scoredBy === 'auto' || b.scoredBy === undefined)
              ? `${sum(rows.map((b) => b.points))}/${sum(rows.map((b) => b.maxPoints))}`
              : undefined
            : rows.length > 1
              ? `${rows.filter((b) => b.correct === true).length}/${rows.length}`
              : undefined;
    const single = rows.length === 1 && !judged ? rows[0] : undefined;
    const res = !review || score ? 'none' : single?.correct === true ? 'correct' : single?.correct === false ? 'wrong' : 'none';
    const answered = !review && pageAnswered(f, responses);
    const range = table ?? `${f.display}${f.displayTo && f.displayTo !== f.display ? `–${f.displayTo}` : ''}`;
    return (
      <PartPager
        key={i}
        layout="question"
        // exam papers: the first number of each Part carries the Part's label (GitHub #72)
        kicker={exam && f.firstInSection ? `P${f.section.part ?? ''}` : undefined}
        label={range}
        labelKind={f.displayTo && !table ? 'range' : 'number'}
        selected={i === index}
        completed={answered}
        result={res}
        score={score}
        reviewing={!!review}
        flagged={examMode && !!attempt.flagged?.includes(f.q.id)}
        onClick={() => go(i)}
        ariaLabel={t('reader.dotLabel', {
          part: exam && f.section.part ? t('reader.partPrefix', { part: f.section.part }) : '',
          n: range,
          state: score
            ? t(judged && !table ? 'reader.dotScore' : 'reader.dotRight', { score })
            : res === 'correct'
              ? t('reader.dotCorrect') : res === 'wrong' ? t('reader.dotWrong') : answered ? t('reader.dotAnswered') : '',
        })}
      />
    );
  };

  // the right-hand footer button: next question; on the last one 提交 (dim while questions are left, still tappable →
  // the confirmation) or, after submitting, 重新作答
  const navAction: NavAction = submitted
    ? isLast
      ? { kind: 'retry', label: t('reader.retry'), onClick: retry }
      : { kind: 'next', label: t('reader.next'), onClick: () => go(visible[pos + 1]) }
    : isLast
      ? { kind: 'submit', label: t('reader.submit'), dim: unanswered.length > 0, onClick: () => (unanswered.length ? setConfirmOpen(true) : submit()) }
      : { kind: 'next', label: t('reader.next'), onClick: () => go(visible[pos + 1]) };

  // 真题 / PET footer (question-nav-part 19706:145652): the Parts as cards. A Part's numbers are its questions — every
  // question of a Part answered on one page, each examiner question of a speaking Part — each opening its page.
  const examSections = exam ? [...new Set(flat.map((f) => f.section))] : [];
  const examPartPages = examSections.map((s) => flat.filter((f) => f.section === s).map((f) => f.index));
  const examUnits = examSections.map((s) =>
    flat
      .filter((f) => f.section === s)
      .flatMap((f) => {
        const flaggedQ = (id: string) => examMode && !!attempt.flagged?.includes(id);
        if (f.group)
          return f.section.questions.map((q) => {
            const row = review?.result.byQuestion.find((b) => b.q === q.id);
            return { id: q.id, number: q.number as number | string, page: f.index, answered: isAnswered(q, responses[q.id]), correct: row?.correct, flagged: flaggedQ(q.id), score: undefined as string | undefined };
          });
        const qs = f.choose ? f.section.questions : [f.q];
        const rows = qs.map((q) => review?.result.byQuestion.find((b) => b.q === q.id)).filter((b) => b !== undefined);
        const scored = f.choose ? rows.filter((b) => b.scoredBy !== 'none') : rows;
        const objective = qs.every((q) => isScored(q)) && f.turn === undefined && scored.length === 1;
        // a judged page (writing, speaking — the last examiner question) shows score / full marks (#128)
        const lastTurn = f.turn === undefined || f.q.interaction.kind !== 'speaking' || f.turn === f.q.interaction.turns.length - 1;
        const done = (ns: number[]) => Math.round(ns.reduce((a, b) => a + b, 0) * 100) / 100;
        const score =
          review && !objective && lastTurn && scored.length && scored.every((b) => b.scoredBy === 'judge' || b.scoredBy === 'auto' || b.scoredBy === undefined)
            ? `${done(scored.map((b) => b.points))}/${done(scored.map((b) => b.maxPoints))}`
            : undefined;
        return [{
          id: f.turn !== undefined ? `${f.q.id}#${f.turn}` : f.q.id,
          number: f.display as number | string,
          page: f.index,
          answered: pageAnswered(f, responses),
          correct: objective ? scored[0].correct : undefined,
          flagged: flaggedQ(f.q.id),
          score,
        }];
      }),
  );
  const examParts: PartNavPart[] = examSections.map((s, pi) => {
    const units = examUnits[pi];
    const part = s.part ?? pi + 1;
    const done = units.filter((u) => u.answered).length;
    const first = units[0]?.number;
    const last = units[units.length - 1]?.number;
    const range = first === last ? t('reader.partRangeOne', { n: first }) : t('reader.partRange', { first, last });
    // after submitting: right / total for objective questions, score / full marks for judged ones (#128); nothing
    // while a mark is still coming
    const rows = s.questions.map((q) => review?.result.byQuestion.find((b) => b.q === q.id)).filter((b) => b !== undefined);
    const marked = s.choose ? rows.filter((b) => b.scoredBy !== 'none') : rows;
    const judged = s.questions.some((q) => !isScored(q));
    const sum = (ns: number[]) => Math.round(ns.reduce((a, b) => a + b, 0) * 100) / 100;
    const score = !review || !marked.length || marked.some((b) => b.scoredBy === 'pending' || b.scoredBy === 'self' || (!judged && b.correct === null))
      ? undefined
      : judged
        ? `${sum(marked.map((b) => b.points))}/${sum(marked.map((b) => b.maxPoints))}`
        : `${marked.filter((b) => b.correct === true).length}/${marked.length}`;
    const title = t('reader.partTitle', { part });
    return {
      id: s.id,
      title,
      kicker: t('reader.partKicker', { part }),
      range,
      questions: units.map((u) => {
        const state: PartQuestionState = review ? (u.correct === true ? 'correct' : u.correct === false ? 'wrong' : 'none') : u.answered ? 'answered' : 'none';
        return {
          id: u.id,
          number: u.number,
          state,
          current: u.page === index,
          flagged: u.flagged,
          score: u.score,
          ariaLabel: t('reader.dotLabel', {
            part: t('reader.partPrefix', { part }),
            n: u.number,
            state: u.score
              ? t('reader.dotScore', { score: u.score })
              : state === 'correct' ? t('reader.dotCorrect') : state === 'wrong' ? t('reader.dotWrong') : state === 'answered' ? t('reader.dotAnswered') : '',
          }),
        };
      }),
      count: review ? score : `${done}/${units.length}`,
      complete: done === units.length,
      ariaLabel: t('reader.partCard', { part: title, range: first === last ? `${first}` : `${first}–${last}`, done, total: units.length }) + (score ? t('reader.dotRight', { score }) : ''),
    };
  });

  return (
    <div className={`reader-body tab-${tab} ${soloQuestions ? 'no-left' : ''}`}>
      <SegmentedTabs<Tab>
        className="reader-tabs"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'article', label: exam ? t('reader.tabMaterial') : t('reader.tabArticle') },
          { id: 'questions', label: t('reader.tabQuestions', { progress: submitted ? '' : `${tabProgress.done}/${tabProgress.total}` }) },
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
            listening={attempt.listening}
            onListening={markListening}
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
                          onTimeUp={() => (examAudioPlaying || (exam.paper === 'listening' && attempt.listening) ? setSubmitAfterAudio(true) : void submit())}
                        />
                      ) : undefined
                    }
                    onSwitch={() => setSwitchOpen(true)}
                  />,
                  headSlot,
                )}
              {exam && submitted && result && !modeDialog && (
                <div className="exam-bar">
                  <Chip onClick={() => setReportOpen(true)}>{t('exam.report.title')}</Chip>
                </div>
              )}
            </>
          }
          footer={
            <>
              {submitError && (
                // UniRead Message (designer's frame 1.19): a toast at the top of the page
                <Message>{submitError.status ? t('reader.gradeUnavailable', { status: submitError.status }) : t('reader.networkError')}</Message>
              )}
              {exam ? (
                <PartNav
                  label={t('reader.nav')}
                  parts={examParts}
                  page={Math.max(0, examParts.findIndex((p) => p.questions.some((q) => q.current)))}
                  review={!!review}
                  prev={{ label: t('reader.prev'), hidden: pos <= 0, disabled: false, onClick: () => go(visible[pos - 1]) }}
                  action={navAction}
                  onPage={(pi) => go(examPartPages[pi][0])}
                  onPickQuestion={(pi, uid) => go(examUnits[pi].find((u) => u.id === uid)?.page ?? examPartPages[pi][0])}
                />
              ) : (
                <QuestionNav
                  label={t('reader.nav')}
                  current={index}
                  count={visible.length}
                  prev={{ label: t('reader.prev'), hidden: pos <= 0, onClick: () => go(visible[pos - 1]) }}
                  action={navAction}
                >
                  {visible.map((i) => pager(i))}
                </QuestionNav>
              )}
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
              {examMode && (
                // 标记本题 (flag-toggle 19834:178047) floats at the right of the question's title
                <FlagToggle
                  flagged={!!attempt.flagged?.includes(current.q.id)}
                  label={t('reader.flag')}
                  flaggedLabel={t('reader.flagged')}
                  onToggle={() => toggleFlag(current.q.id)}
                />
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
      {exam && reportOpen && result && <ExamReport item={exam} result={result} responses={responses} onClose={() => setReportOpen(false)} />}
      {confirmOpen && (
        <Dialog
          className="submit-confirm"
          title={t('reader.unansweredTitle', { count: unanswered.length })}
          closeLabel={t('common.close')}
          onClose={() => setConfirmOpen(false)}
          actions={
            <>
              {/* one line in every language: a longer label shrinks to fit the pill instead of wrapping and being cut off */}
              <QuizButton onClick={submit}>
                <FittyText>{t('reader.submitAnyway')}</FittyText>
              </QuizButton>
              <QuizButton variant="primary" autoFocus onClick={() => setConfirmOpen(false)}>
                <FittyText>{t('reader.keepAnswering')}</FittyText>
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
  item,
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
    // KET / PET: the answer as printed in the answer book (accept[0]); the other forms are only what the marker also
    // takes (7.45 / seven forty-five / quarter to eight …), not more answers to learn
    answerText = Object.values(k.slots)
      .map((s) => (isExam(item) ? s.accept[0] : s.accept.join(' / ')))
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
  // Cambridge writing: the sample is a real candidate's script from the answer book, printed with its own mistakes —
  // say so, with the examiner's mark and comment, so it is not read as a model to copy word for word
  const candidate = 'sampleAnswer' in k && isCambridge(k.rubricType) ? k.sampleMark : undefined;
  const candidateMax = 'keyPoints' in k ? (k.keyPoints ?? []).reduce((n, p) => n + p.weight, 0) : 0;
  const sampleLabel = candidate && candidateMax ? t('reader.candidateSample', { score: candidate.score, max: candidateMax }) : t('reader.sampleAnswer');
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
              ? scored
                ? t('reader.scored', { points: r.points, max: r.maxPoints })
                : sampleLabel
              : undefined
      }
      label={isSample ? sampleLabel : t('reader.correctAnswer')}
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
      {candidate?.noteZh && <AnswerExplain variant="block">{t('reader.examinerNote', { text: candidate.noteZh })}</AnswerExplain>}
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
