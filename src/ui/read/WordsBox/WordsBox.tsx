import './WordsBox.css';

export interface WordsBoxItem {
  id: string;
  headword: string;
  ipa?: string;
  pos?: string;
  meaningZh: string;
}

/**
 * RC/Read/WordsBox (proposed, issue #138): the "Words & Expressions" box at the end of an article — headword,
 * /IPA/, part of speech, Chinese meaning. The title is the book's own English heading (content, not UI text).
 * Keeps the legacy classes (.words-box, .words-head …).
 */
export function WordsBox({ title = 'Words & Expressions', items }: { title?: string; items: WordsBoxItem[] }) {
  return (
    <section className="words-box" aria-label={title}>
      <h2 className="words-box-title">{title}</h2>
      <ul>
        {items.map((v) => (
          <li key={v.id}>
            <span className="words-head">{v.headword}</span>
            {v.ipa && <span className="words-ipa">/{v.ipa}/</span>}
            {v.pos && <span className="words-pos">{v.pos}</span>}
            <span className="words-zh">{v.meaningZh}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
