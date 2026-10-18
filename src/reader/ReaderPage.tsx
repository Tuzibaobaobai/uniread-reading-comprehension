import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { AttemptT, ItemKeyT, ItemT } from '@schema';
import { staticContent } from '@/lib/content';
import { localAttempts, newAttempt } from '@/lib/storage';
import { isAnswered, isScored, type Result } from '@/lib/grading';
import { applyJudgement, fallbackToSelf } from '@/lib/judge';
import { Check, Cross, Locate } from '@/components/Icons';
import arrowLeft from '@/assets/icons/arrow-left.svg';
import correctIcon from '@/assets/icons/correct.svg';
import wrongIcon from '@/assets/icons/wrong.svg';
import { plainText, type BlankNode } from '@/components/Rich';
import { ArticlePane } from './ArticlePane';
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
  type InteractionProps,
} from './interactions';
import { blankCorrect, blankOwners, blankText, correctBlankText, evidenceOf, flatten, showFirstLetter, type Responses } from './model';

export function ReaderPage() {
  const { playlistId = '', itemId = '' } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<ItemT | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItem(null);
    staticContent.getItem(itemId).then(setItem, (e: Error) => setError(e.message));
  }, [itemId]);

  return (
    <div className="reader">
      <header className="reader-head">
        <button className="back-button" onClick={() => navigate(`/p/${playlistId}`)} aria-label="返回合集">
          <img src={arrowLeft} alt="" />
        </button>
        <span className="reader-head-title">{item?.title ?? ''}</span>
      </header>
      {error && <p className="error">加载失败：{error}</p>}
      {item && <Reader key={item.id} item={item} />}
    </div>
  );
}

type Tab = 'article' | 'questions';

function Reader({ item }: { item: ItemT }) {
  const flat = useMemo(() => flatten(item), [item]);
  const owners = useMemo(() => blankOwners(flat), [flat]);

  const [attempt, setAttempt] = useState<AttemptT>(() => localAttempts.get(item.id) ?? newAttempt(item.id, item.status.version));
  const [index, setIndex] = useState(() => Math.max(0, flat.findIndex((f) => f.q.id === localAttempts.getPosition(item.id))));
  const [key, setKey] = useState<ItemKeyT | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // narrow screens: open on the questions tab when coming back to review a submitted attempt
  const [tab, setTab] = useState<Tab>(() => (attempt.status === 'submitted' ? 'questions' : 'article'));
  const articleRef = useRef<HTMLDivElement>(null);
  const sessionStart = useRef(Date.now());
  const flashTimer = useRef<number>();
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    if (flat[index]) localAttempts.setPosition(item.id, flat[index].q.id);
    document.querySelector('.question-dot.is-current')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [item.id, index]);

  const elapsed = () => attempt.durationSec + (Date.now() - sessionStart.current) / 1000;

  const submit = async () => {
    setConfirmOpen(false);
    setSubmitError(null);
    let graded: Awaited<ReturnType<typeof staticContent.grade>>;
    try {
      graded = await staticContent.grade(item, responses);
    } catch (e) {
      // fetch rejects (TypeError) only when the request never reached a server
      setSubmitError(
        (e as { status?: number }).status
          ? `判分服务暂时不可用（${(e as { status: number }).status}），你的答案已保存，请稍后再提交。`
          : '网络连接失败，你的答案已保存，请检查网络后再提交。',
      );
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
    void runJudge(submitted);
  };

  /** score constructed responses with the LLM judge; questions it can't judge fall back to self-assessment */
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
    localAttempts.clear(item.id);
    sessionStart.current = Date.now();
    setAttempt(newAttempt(item.id, item.status.version));
    setKey(null);
    setIndex(0);
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

  const unanswered = flat.filter((f) => !isAnswered(f.q, responses[f.q.id]));
  const current = flat[index];

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

  /** scroll to the evidence sentence and flash it (falls back to the whole block) */
  const locate = (blockId: string, quote?: string) => {
    setTab('article');
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
        aria-label={`第 ${n.number ?? ''} 空${text ? `：${text}` : '，未作答'}`}
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

  const iprops: InteractionProps | null = current
    ? { item, fq: current, flat, owners, responses, setResponses, review, onLocate: locate }
    : null;

  const pos = visible.indexOf(index);
  const isLast = pos === visible.length - 1;
  const evidence = useMemo(() => (review ? evidenceOf(review.key, current?.q.id) : []), [review?.key, current?.q.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`reader-body tab-${tab}`}>
      <div className="reader-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'article'} className={tab === 'article' ? 'is-active' : ''} onClick={() => setTab('article')}>
          文章
        </button>
        <button role="tab" aria-selected={tab === 'questions'} className={tab === 'questions' ? 'is-active' : ''} onClick={() => setTab('questions')}>
          题目 {submitted ? '' : `${flat.length - unanswered.length}/${flat.length}`}
        </button>
      </div>

      <section className="reader-left">
        <ArticlePane ref={articleRef} item={item} renderBlank={renderBlank} evidence={evidence} />
      </section>

      <section className="reader-right">
        <div className="question-card">
          <div className="question-scroll thin-scroll">
            {current && iprops && (
              <>
                {current.section.instruction && (
                  <p className="section-instruction">
                    {current.section.label && <b>{current.section.label}. </b>}
                    {current.section.instruction}
                  </p>
                )}
                <QuestionBody
                  props={iprops}
                  selfAssessed={result?.selfAssessed?.[current.q.id]}
                  onSelfAssess={(v) =>
                    result &&
                    persist({ ...attempt, result: { ...result, selfAssessed: { ...result.selfAssessed, [current.q.id]: v } } })
                  }
                />
                {review && !EMBEDDED_EXPLAIN.has(current.q.interaction.kind) && (
                  <Explanation item={item} fq={current} keyData={review.key} onLocate={locate} result={review.result} />
                )}
              </>
            )}
          </div>

          {submitError && (
            <p className="submit-error" role="alert">
              {submitError}
            </p>
          )}
          <nav className="question-nav" aria-label="题目导航">
            <button className="pill-button" disabled={pos <= 0} onClick={() => go(visible[pos - 1])}>
              上一题
            </button>
            <div className="question-dots">
              {visible.map((i) => {
                const f = flat[i];
                const r = review?.result.byQuestion.find((b) => b.q === f.q.id);
                const state = review
                  ? r?.correct === true
                    ? 'is-correct'
                    : r?.correct === false
                      ? 'is-wrong'
                      : 'is-neutral'
                  : isAnswered(f.q, responses[f.q.id])
                    ? 'is-answered'
                    : '';
                return (
                  <button
                    key={i}
                    className={`question-dot ${i === index ? 'is-current' : ''} ${state}`}
                    onClick={() => go(i)}
                    aria-label={`第 ${f.q.number} 题${state === 'is-correct' ? '，正确' : state === 'is-wrong' ? '，错误' : state === 'is-answered' ? '，已作答' : ''}`}
                    aria-current={i === index}
                  >
                    {state === 'is-correct' || state === 'is-wrong' ? (
                      <img className="question-dot-icon" src={state === 'is-correct' ? correctIcon : wrongIcon} alt="" />
                    ) : (
                      <>
                        <span className="question-dot-num">{f.q.number}</span>
                        {!review && <span className="question-dot-mark" aria-hidden />}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
            {submitted ? (
              isLast ? (
                <button className="pill-button" onClick={retry}>
                  重新作答
                </button>
              ) : (
                <button className="pill-button" onClick={() => go(visible[pos + 1])}>
                  下一题
                </button>
              )
            ) : isLast ? (
              <button
                className={`pill-button primary ${unanswered.length ? 'is-dim' : ''}`}
                onClick={() => (unanswered.length ? setConfirmOpen(true) : submit())}
              >
                提交
              </button>
            ) : (
              <button className="pill-button" onClick={() => go(visible[pos + 1])}>
                下一题
              </button>
            )}
          </nav>
        </div>
      </section>

      {confirmOpen && (
        <div className="dialog-backdrop" role="presentation" onClick={() => setConfirmOpen(false)}>
          <div className="dialog" role="dialog" aria-modal aria-labelledby="dlg-title" onClick={(e) => e.stopPropagation()}>
            <h2 id="dlg-title">还有 {unanswered.length} 题没有作答</h2>
            <p>点击题号返回作答：</p>
            <div className="dialog-dots">
              {unanswered.map((f) => (
                <button
                  key={f.q.id}
                  className="question-dot"
                  aria-label={`第 ${f.q.number} 题`}
                  onClick={() => {
                    setConfirmOpen(false);
                    go(f.index);
                    setTab('questions');
                  }}
                >
                  <span className="question-dot-num">{f.q.number}</span>
                </button>
              ))}
            </div>
            <div className="dialog-actions">
              <button className="pill-button" onClick={submit}>
                仍然提交
              </button>
              <button className="pill-button primary" autoFocus onClick={() => setConfirmOpen(false)}>
                继续作答
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

function QuestionBody({
  props,
  selfAssessed,
  onSelfAssess,
}: {
  props: InteractionProps;
  selfAssessed?: boolean;
  onSelfAssess: (v: boolean) => void;
}) {
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
  }
}

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
        .join('；');
    } else if ('options' in it) {
      answerText = k.correct
        .map((id) => {
          const o = it.options.find((x) => x.id === id);
          return it.kind === 'choice' && it.variant === 'trueFalse' ? (id === 'T' ? 'True' : 'False') : o ? `${id}. ${plainText(o.content)}` : id;
        })
        .join('；');
    }
  } else if ('slots' in k) {
    answerText = Object.values(k.slots)
      .map((s) => s.accept.join(' / '))
      .join('；');
  } else if ('pairs' in k) {
    answerText = Object.entries(k.pairs)
      .map(([l, rr]) => `${l}–${rr}`)
      .join('，');
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
            <Check /> 回答正确
          </>
        )}
        {r?.correct === false && (
          <>
            <Cross /> {r.points > 0 ? `部分正确（${Math.round(r.points * 100) / 100}/${r.maxPoints}）` : '回答错误'}
          </>
        )}
        {r?.correct === null && <>参考答案</>}
      </div>
      <p className="explain-answer">
        <span className="explain-label">{isSample ? '参考答案' : '正确答案'}</span>
        {answerText}
      </p>
      {'rubricZh' in k && k.rubricZh && <p className="explain-text">要点：{k.rubricZh}</p>}
      {k.explanationZh && <p className="explain-text">{k.explanationZh}</p>}
      {k.tipsZh && <p className="explain-text explain-tip">语言点：{k.tipsZh}</p>}
      {k.evidence?.[0] && (
        <button className="chip" onClick={() => onLocate(k.evidence![0].block, k.evidence![0].quote)}>
          <Locate /> 定位原文
        </button>
      )}
    </div>
  );
}

export { isScored };
