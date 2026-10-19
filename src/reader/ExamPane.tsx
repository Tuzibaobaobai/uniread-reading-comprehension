import { forwardRef, useRef, type ReactNode } from 'react';
import type { BlockT, ExamItemT } from '@schema';
import type { BlankNode } from '@/components/Rich';
import { AudioPlayer } from './AudioPlayer';
import { Block, Figure, mergeRefs, useEvidencePaint } from './ArticlePane';
import type { FlatQuestion } from './model';

interface Props {
  item: ExamItemT;
  /** current question: its Part decides what the pane shows */
  fq: FlatQuestion | undefined;
  renderBlank: (n: BlankNode) => ReactNode;
  evidence: { block: string; quote: string }[];
  /** listening transcript of the current Part (after submitting) */
  transcript?: BlockT[];
  /** exam mode: recordings play once, without pause or seeking */
  locked: boolean;
  played: Set<string>;
  onPlayed: (sectionId: string) => void;
}

/**
 * left pane of an exam paper: the current Part's heading, recording (Listening), the current question's own
 * material (e.g. a Part 1 notice) and the Part's texts; after submitting, the Listening transcript.
 */
export const ExamPane = forwardRef<HTMLDivElement, Props>(function ExamPane(
  { item, fq, renderBlank, evidence, transcript, locked, played, onPlayed },
  ref,
) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const section = fq?.section;
  const fallback = useEvidencePaint(rootRef, evidence, [section?.id, fq?.q.id]);
  const image = (id: string) => item.article.images.find((i) => i.id === id);
  const blocks = (list: BlockT[] | undefined) =>
    list?.map((b) =>
      b.type === 'imageRef' ? (
        <Figure key={b.id} img={image(b.image)} />
      ) : (
        <Block key={b.id} block={b} renderBlank={renderBlank} evidence={fallback.has(b.id)} />
      ),
    );
  const qMaterial = fq?.q.material;
  return (
    <div className="article-pane exam-pane">
      <div className="article-scroll thin-scroll" ref={mergeRefs(rootRef, ref)}>
        {section && (
          <article className="article">
            <p className="exam-part-kicker">{item.title}</p>
            <h1 className="article-title">{section.label ?? `Part ${section.part}`}</h1>
            <p className="exam-instruction">{section.instruction}</p>
            {section.audio && (
              <AudioPlayer
                key={section.id}
                src={section.audio.src}
                seconds={section.audio.seconds}
                locked={locked}
                played={played.has(section.id)}
                onPlayed={() => onPlayed(section.id)}
              />
            )}
            {qMaterial && qMaterial.length > 0 && (
              <div className={`article-body exam-q-material ${qMaterial.filter((b) => b.type === 'imageRef').length > 1 ? 'is-sequence' : ''}`}>
                {blocks(qMaterial)}
              </div>
            )}
            {section.material && section.material.length > 0 && <div className="article-body">{blocks(section.material)}</div>}
            {!qMaterial?.length && !section.material?.length && !section.audio && (
              <p className="exam-empty">本部分没有阅读材料，请直接在右侧作答。</p>
            )}
            {transcript && transcript.length > 0 && (
              <details className="transcript" open>
                <summary>听力原文</summary>
                <div className="article-body">{blocks(transcript)}</div>
              </details>
            )}
          </article>
        )}
      </div>
    </div>
  );
});
