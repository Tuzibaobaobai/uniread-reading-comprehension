import { scrollBehavior } from '@/lib/scroll';
import { forwardRef, useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { BlockT, ExamItemT, SectionT } from '@schema';
import type { BlankNode } from '@/components/Rich';
import { staticContent } from '@/lib/content';
import playIcon from '@/assets/icons/audio-play.svg';
import { Panel } from '@/ui/common/Panel/Panel';
import { Disclosure } from '@/ui/common/Disclosure/Disclosure';
import { ArticleHeader } from '@/ui/read/ArticleHeader/ArticleHeader';
import { ArticleBody, ArticleText } from '@/ui/read/ArticleText/ArticleText';
import { FigureGrid } from '@/ui/read/Figure/Figure';
import { ListeningPart, ListeningPartStart, ListeningPartState } from '@/ui/exam/ListeningPart/ListeningPart';
import { AudioPlayer as AudioPlayerView } from '@/ui/AudioPlayer/AudioPlayer';
import { AudioPlayer } from './AudioPlayer';
import { Block, Figure, mergeRefs, useEvidencePaint } from './ArticlePane';
import { isFormBlock, type FlatQuestion } from './model';
import { Emph } from './interactions';

interface Props {
  item: ExamItemT;
  /** current question: its Part decides what the pane shows */
  fq: FlatQuestion | undefined;
  renderBlank: (n: BlankNode) => ReactNode;
  evidence: { block: string; quote: string }[];
  /** listening transcripts by section (after submitting) */
  transcripts?: Record<string, BlockT[]>;
  /** exam mode: recordings play once, in order, without pause or seeking */
  locked: boolean;
  played: Set<string>;
  onPlayed: (sectionId: string) => void;
  /** exam mode: the recording in progress when the page was left (it continues from `at`, never from the start) */
  listening?: { section: string; at: number };
  onListening?: (sectionId: string, at: number) => void;
  /** exam mode: whether the exam recording is playing (time-up waits for it to end, #109) */
  onPlayingChange?: (playing: boolean) => void;
}

/**
 * left pane of an exam paper (rc/Common/Panel Kind exam; heading rc/Read/ArticleHeader Kicker + Instruction).
 * Reading & Writing / Speaking: the current Part's heading, the current question's own material (e.g. a Part 1
 * notice) and the Part's texts.
 * Listening (GitHub #72): every Part's recording stacked vertically — title, instructions, controls — so the audio
 * never follows question navigation; the current question's Part shows its material and, after submitting, its
 * transcript.
 */
export const ExamPane = forwardRef<HTMLDivElement, Props>(function ExamPane(props, ref) {
  const { item, fq, renderBlank, evidence } = props;
  const { t } = useTranslation();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const section = fq?.section;
  const fallback = useEvidencePaint(rootRef, evidence, [section?.id, fq?.q.id]);
  const image = (id: string) => item.article.images.find((i) => i.id === id);
  // a question's own pictures keep their natural height (rc/Read/Figure Size full)
  const blocks = (list: BlockT[] | undefined, figureSize?: 'full') =>
    list?.map((b) =>
      b.type === 'imageRef' ? (
        <Figure key={b.id} img={image(b.image)} size={figureSize} />
      ) : (
        <Block key={b.id} block={b} renderBlank={renderBlank} evidence={fallback.has(b.id)} imageOf={image} />
      ),
    );
  const qMaterial = fq?.q.material;
  const materialOf = (s: SectionT, withQuestion: boolean) => (
    <>
      {withQuestion && qMaterial && qMaterial.length > 0 && (
        // several pictures read as a sequence (rc/Read/Figure Size grid-3)
        <FigureGrid className="article-body exam-q-material" sequence={qMaterial.filter((b) => b.type === 'imageRef').length > 1}>
          {blocks(qMaterial, 'full')}
        </FigureGrid>
      )}
      {/* listening: the notes form is drawn in the question pane (Ready frame 2.08) */}
      {s.material && s.material.length > 0 && (
        <ArticleBody>{blocks(item.paper === 'listening' ? s.material.filter((b) => !isFormBlock(b)) : s.material)}</ArticleBody>
      )}
      {props.transcripts?.[s.id] && props.transcripts[s.id].length > 0 && (
        // after submitting: the Part's transcript (rc/Common/Disclosure, open)
        <Disclosure className="transcript" summary={t('reader.transcript')} defaultOpen>
          <ArticleBody>{blocks(props.transcripts[s.id])}</ArticleBody>
        </Disclosure>
      )}
    </>
  );
  return (
    <Panel kind="exam" ref={mergeRefs(rootRef, ref)}>
      {item.paper === 'listening' ? (
        <ListeningStack {...props} current={section?.id} materialOf={materialOf} />
      ) : (
        section && (
          <ArticleText>
            <ArticleHeader kicker={kickerText(item.title)} title={section.label ?? `Part ${section.part}`} instruction={<Emph text={section.instruction} />} />
            {materialOf(section, true)}
            {!qMaterial?.length && !section.material?.length && <p className="exam-empty">{t('reader.noMaterial')}</p>}
          </ArticleText>
        )
      )}
    </Panel>
  );
});

/**
 * Listening: one module per Part (rc/Exam/ListeningPart). Practice — each module has its own controls, one Part plays at a time, nothing
 * advances by itself. Exam — one shared recording plays the Parts in exam order (the first play needs a tap, later
 * Parts follow automatically), the playing Part is highlighted, and nothing can be paused, sought or replayed. Parts
 * still waiting for their turn show only their title and instruction (designer's frame 2.03).
 */
function ListeningStack({
  item,
  current,
  locked,
  played,
  onPlayed,
  listening,
  onListening,
  onPlayingChange,
  materialOf,
}: Props & { current?: string; materialOf: (s: SectionT, withQuestion: boolean) => ReactNode }) {
  const { t } = useTranslation();
  const parts = item.sections.filter((s) => s.audio);
  const [active, setActive] = useState<string | null>(null);
  const seq = useExamSequence(parts, locked, played, onPlayed, listening, onListening);
  // the exam recording counts as running while a Part plays or, once started, while later Parts still wait to be
  // played (e.g. the browser blocked the automatic continue and the Part's start button is shown)
  const recordingPending = locked && (!!seq.playing || (played.size > 0 && parts.some((p) => !played.has(p.id))));
  useEffect(() => onPlayingChange?.(recordingPending), [recordingPending]); // eslint-disable-line react-hooks/exhaustive-deps
  const moduleRefs = useRef(new Map<string, HTMLElement>());

  // bring the current question's Part into view when the learner moves to another Part
  useEffect(() => {
    if (current) moduleRefs.current.get(current)?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  }, [current]);

  return (
    <ArticleText className="listening-stack">
      <ArticleHeader kicker={kickerText(item.title)} />
      {seq.audio}
      {item.sections.map((s) => {
        const isCurrent = s.id === current;
        const isPlaying = locked ? seq.playing === s.id : active === s.id;
        return (
          <ListeningPart
            key={s.id}
            ref={(el) => (el ? moduleRefs.current.set(s.id, el) : moduleRefs.current.delete(s.id))}
            title={s.label ?? `Part ${s.part}`}
            mode={locked ? 'exam' : 'practice'}
            current={isCurrent}
            playing={isPlaying}
            playingLabel={t('audio.nowPlaying')}
            instruction={<Emph text={s.instruction} />}
            // the designer's cards (2.03, 2.07) carry no rule line; exam mode keeps it next to the start button, where the
            // learner reads it before the one-time recording begins
            note={locked && seq.startable(s) ? t('audio.examNote') : undefined}
          >
            {!s.audio && <ListeningPartState>{t('audio.missing')}</ListeningPartState>}
            {s.audio &&
              (locked ? (
                seq.controls(s)
              ) : (
                <AudioPlayer src={s.audio.src} seconds={s.audio.seconds} active={active === s.id} onPlay={() => setActive(s.id)} />
              ))}
            {isCurrent && materialOf(s, true)}
          </ListeningPart>
        );
      })}
    </ArticleText>
  );
}

/** exam mode: one audio element plays the Parts in order (a tap starts it; later Parts follow automatically) */
function useExamSequence(
  parts: SectionT[],
  locked: boolean,
  played: Set<string>,
  onPlayed: (id: string) => void,
  resume?: { section: string; at: number },
  onPosition?: (id: string, at: number) => void,
) {
  const { t } = useTranslation();
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [time, setTime] = useState(0);
  const next = parts.find((p) => !played.has(p.id) && p.id !== playing);
  // a Part interrupted by a reload continues where it was (a recording is heard once, as in the exam room)
  const resumeAt = (s: SectionT) => (resume && resume.section === s.id && !played.has(s.id) ? resume.at : 0);
  const saved = useRef(0);

  const play = (s: SectionT) => {
    const a = audio.current;
    if (!a || !s.audio) return;
    const from = resumeAt(s);
    a.src = staticContent.assetUrl(s.audio.src) + (from > 0 ? `#t=${from.toFixed(1)}` : '');
    saved.current = from;
    setPlaying(s.id);
    setTime(from);
    onPosition?.(s.id, from);
    void a.play().catch(() => setPlaying(null)); // blocked without a tap: the Part's start button stays
  };
  // switching to practice mode stops the exam recording
  useEffect(() => {
    if (!locked) {
      audio.current?.pause();
      setPlaying(null);
    }
  }, [locked]);

  const element = locked ? (
    <audio
      ref={audio}
      preload="none"
      onTimeUpdate={(e) => {
        const now = e.currentTarget.currentTime;
        setTime(now);
        // remember the position every few seconds (a reload continues from here)
        if (playing && Math.abs(now - saved.current) >= 3) {
          saved.current = now;
          onPosition?.(playing, now);
        }
      }}
      onEnded={() => {
        const done = playing;
        if (!done) return;
        onPlayed(done);
        const i = parts.findIndex((p) => p.id === done);
        const following = parts.slice(i + 1).find((p) => !played.has(p.id));
        if (following) play(following);
        else setPlaying(null);
      }}
    />
  ) : null;

  /** the next Part to play, waiting for a tap (the first one, or one the browser would not continue by itself) */
  const startable = (s: SectionT) => !playing && next?.id === s.id;
  const controls = (s: SectionT) => {
    // exam mode: the locked recording, progress only (ui/AudioPlayer Mode=exam)
    if (playing === s.id) return <AudioPlayerView mode="exam" time={time} duration={s.audio!.seconds} labels={{ progress: t('audio.progress') }} />;
    if (played.has(s.id)) return <ListeningPartState>{t('audio.finished')}</ListeningPartState>;
    if (startable(s))
      return (
        <ListeningPartStart icon={playIcon} onClick={() => play(s)}>
          {s.id === parts[0]?.id && resumeAt(s) === 0 ? t('audio.start') : t('audio.continueFrom', { part: s.label ?? `Part ${s.part}` })}
        </ListeningPartStart>
      );
    return null;
  };
  return { audio: element, playing, controls, startable };
}

/** Ready frames 2.14–2.23: the paper kicker reads 「KET 真题 1 · 第 1 套 · 阅读与写作」 (the data title is 「KET真题1-第1套-阅读与写作」) */
export function kickerText(title: string): string {
  return title
    .split('-')
    .map((part) => part.replace(/([A-Za-z0-9])(?=[\u4e00-\u9fff])|([\u4e00-\u9fff])(?=[A-Za-z0-9])/g, '$1$2 ').trim())
    .join(' · ');
}
