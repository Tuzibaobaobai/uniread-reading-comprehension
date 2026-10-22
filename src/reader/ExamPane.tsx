import { forwardRef, useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { BlockT, ExamItemT, SectionT } from '@schema';
import type { BlankNode } from '@/components/Rich';
import { staticContent } from '@/lib/content';
import playIcon from '@/assets/icons/audio-play.svg';
import { AudioPlayer, Progress } from './AudioPlayer';
import { Block, Figure, mergeRefs, useEvidencePaint } from './ArticlePane';
import type { FlatQuestion } from './model';
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
}

/**
 * left pane of an exam paper.
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
  const blocks = (list: BlockT[] | undefined) =>
    list?.map((b) =>
      b.type === 'imageRef' ? (
        <Figure key={b.id} img={image(b.image)} />
      ) : (
        <Block key={b.id} block={b} renderBlank={renderBlank} evidence={fallback.has(b.id)} imageOf={image} />
      ),
    );
  const qMaterial = fq?.q.material;
  const materialOf = (s: SectionT, withQuestion: boolean) => (
    <>
      {withQuestion && qMaterial && qMaterial.length > 0 && (
        <div className={`article-body exam-q-material ${qMaterial.filter((b) => b.type === 'imageRef').length > 1 ? 'is-sequence' : ''}`}>
          {blocks(qMaterial)}
        </div>
      )}
      {s.material && s.material.length > 0 && <div className="article-body">{blocks(s.material)}</div>}
      {props.transcripts?.[s.id] && props.transcripts[s.id].length > 0 && (
        <details className="transcript" open>
          <summary>{t('reader.transcript')}</summary>
          <div className="article-body">{blocks(props.transcripts[s.id])}</div>
        </details>
      )}
    </>
  );
  return (
    <div className="article-pane exam-pane">
      <div className="article-scroll thin-scroll" ref={mergeRefs(rootRef, ref)}>
        {item.paper === 'listening' ? (
          <ListeningStack {...props} current={section?.id} materialOf={materialOf} />
        ) : (
          section && (
            <article className="article">
              <p className="exam-part-kicker">{item.title}</p>
              <h1 className="article-title">{section.label ?? `Part ${section.part}`}</h1>
              <p className="exam-instruction">
                <Emph text={section.instruction} />
              </p>
              {materialOf(section, true)}
              {!qMaterial?.length && !section.material?.length && <p className="exam-empty">{t('reader.noMaterial')}</p>}
            </article>
          )
        )}
      </div>
    </div>
  );
});

/**
 * Listening: one module per Part. Practice — each module has its own controls, one Part plays at a time, nothing
 * advances by itself. Exam — one shared recording plays the Parts in exam order (the first play needs a tap, later
 * Parts follow automatically), the playing Part is highlighted, and nothing can be paused, sought or replayed.
 */
function ListeningStack({
  item,
  current,
  locked,
  played,
  onPlayed,
  materialOf,
}: Props & { current?: string; materialOf: (s: SectionT, withQuestion: boolean) => ReactNode }) {
  const { t } = useTranslation();
  const parts = item.sections.filter((s) => s.audio);
  const [active, setActive] = useState<string | null>(null);
  const seq = useExamSequence(parts, locked, played, onPlayed);
  const moduleRefs = useRef(new Map<string, HTMLElement>());

  // bring the current question's Part into view when the learner moves to another Part
  useEffect(() => {
    if (current) moduleRefs.current.get(current)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [current]);

  return (
    <article className="article listening-stack">
      <p className="exam-part-kicker">{item.title}</p>
      {seq.audio}
      {item.sections.map((s) => {
        const isCurrent = s.id === current;
        const isPlaying = locked ? seq.playing === s.id : active === s.id;
        return (
          <section
            key={s.id}
            ref={(el) => (el ? moduleRefs.current.set(s.id, el) : moduleRefs.current.delete(s.id))}
            className={`part-audio ${isCurrent ? 'is-current' : ''} ${isPlaying ? 'is-playing' : ''}`}
            aria-label={s.label ?? `Part ${s.part}`}
          >
            <h2 className="part-audio-title">
              {s.label ?? `Part ${s.part}`}
              {isPlaying && <span className="part-audio-badge">{locked ? t('audio.nowPlaying') : t('audio.playing')}</span>}
            </h2>
            <p className="exam-instruction">
              <Emph text={s.instruction} />
            </p>
            <p className="player-note">{locked ? t('audio.examNote') : t('audio.practiceNote')}</p>
            {!s.audio && <p className="part-audio-state">{t('audio.missing')}</p>}
            {s.audio &&
              (locked ? (
                seq.controls(s)
              ) : (
                <AudioPlayer src={s.audio.src} seconds={s.audio.seconds} active={active === s.id} onPlay={() => setActive(s.id)} />
              ))}
            {isCurrent && materialOf(s, true)}
          </section>
        );
      })}
    </article>
  );
}

/** exam mode: one audio element plays the Parts in order (a tap starts it; later Parts follow automatically) */
function useExamSequence(parts: SectionT[], locked: boolean, played: Set<string>, onPlayed: (id: string) => void) {
  const { t } = useTranslation();
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [time, setTime] = useState(0);
  const next = parts.find((p) => !played.has(p.id) && p.id !== playing);

  const play = (s: SectionT) => {
    const a = audio.current;
    if (!a || !s.audio) return;
    a.src = staticContent.assetUrl(s.audio.src);
    setPlaying(s.id);
    setTime(0);
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
      onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
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

  const controls = (s: SectionT) => {
    if (playing === s.id) return <div className="player is-locked"><Progress time={time} duration={s.audio!.seconds} /></div>;
    if (played.has(s.id)) return <p className="part-audio-state">{t('audio.finished')}</p>;
    if (!playing && next?.id === s.id)
      return (
        <button className="part-audio-start" onClick={() => play(s)}>
          <img src={playIcon} alt="" width={32} height={32} />
          {s.id === parts[0]?.id ? t('audio.start') : t('audio.continueFrom', { part: s.label ?? `Part ${s.part}` })}
        </button>
      );
    return <p className="part-audio-state">{t('audio.waiting')}</p>;
  };
  return { audio: element, playing, controls };
}
