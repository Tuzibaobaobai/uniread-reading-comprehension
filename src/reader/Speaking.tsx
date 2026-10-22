import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Rich } from '@/components/Rich';
import { staticContent } from '@/lib/content';
import listenIcon from '@/assets/icons/speak-listen.svg';
import micIcon from '@/assets/icons/speak-mic.svg';
import playbackIcon from '@/assets/icons/speak-playback.svg';
import submitIcon from '@/assets/icons/speak-submit.svg';
import respeakIcon from '@/assets/icons/speak-respeak.svg';
import loadingIcon from '@/assets/icons/speak-loading.svg';
import { JudgeVerdict, QuestionPrompt, type InteractionProps } from './interactions';

type TurnState = 'idle' | 'recording' | 'transcribing' | 'error';

/** a MediaRecorder type the browser supports (Safari: mp4, Chrome/Firefox: webm/opus) */
function recorderMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  return ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find((m) => MediaRecorder.isTypeSupported(m));
}

let examiner: HTMLAudioElement | null = null;

/** play an examiner line: its generated recording (scripts/tts.mjs, Volcano Engine), else the device's voice */
function speak(turn: { text: string; audio?: { src: string } }) {
  examiner?.pause();
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  if (turn.audio) {
    examiner = new Audio(staticContent.assetUrl(turn.audio.src));
    void examiner.play().catch(() => speakWithDevice(turn.text));
    return;
  }
  speakWithDevice(turn.text);
}

/** fallback: the browser's speech synthesis (British English voice when the device has one) */
function speakWithDevice(text: string) {
  if (typeof speechSynthesis === 'undefined') return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-GB';
  u.rate = 0.9;
  const voice = speechSynthesis.getVoices().find((v) => v.lang === 'en-GB') ?? speechSynthesis.getVoices().find((v) => v.lang.startsWith('en'));
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}

/**
 * 口语 — Figma UIkit-Speak sentence card (subtitle-SpeakMode, State=Focus 8872:81973): one card per examiner line
 * with Listen (TTS) / Speak (record, then tap ✓ to finish; stops by itself at maxSeconds) / Play back.
 * The recording is transcribed by /api/rc/speak; the transcripts are the response and are judged together after
 * submitting, on the Cambridge A2 Key speaking scale. Recordings stay in the browser for playback only.
 */
export function SpeakingView(props: InteractionProps) {
  const { fq, responses, review, item } = props;
  const { t } = useTranslation();
  const it = fq.q.interaction;
  const answers = (responses[fq.q.id] && typeof responses[fq.q.id] === 'object' && !Array.isArray(responses[fq.q.id])
    ? responses[fq.q.id]
    : {}) as Record<string, string>;
  const [active, setActive] = useState<string | null>(null);
  const [state, setState] = useState<TurnState>('idle');
  const [left, setLeft] = useState(0);
  const [clips, setClips] = useState<Record<string, string>>({});
  /** i18n key of the current error (rendered in the current language) */
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const timer = useRef<number>();
  const supported = !!recorderMime() && !!navigator.mediaDevices?.getUserMedia && !!staticContent.speak;

  // stop recording / speech when leaving the question
  useEffect(
    () => () => {
      window.clearInterval(timer.current);
      if (rec.current?.state === 'recording') rec.current.stop();
      examiner?.pause();
      if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
    },
    [fq.q.id],
  );
  if (it.kind !== 'speaking') return null;

  const save = (turnId: string, text: string) =>
    props.setResponses((prev) => {
      const r = { ...((prev[fq.q.id] as Record<string, string>) ?? {}), [turnId]: text };
      return { ...prev, [fq.q.id]: r };
    });

  const start = async (turnId: string) => {
    setError(null);
    examiner?.pause();
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError('speaking.errorMic');
      return;
    }
    const mime = recorderMime();
    const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const chunks: Blob[] = [];
    r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    r.onstop = async () => {
      window.clearInterval(timer.current);
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: r.mimeType || mime });
      setClips((c) => ({ ...c, [turnId]: URL.createObjectURL(blob) }));
      setState('transcribing');
      try {
        const text = await staticContent.speak!({ itemId: item.id, questionId: fq.q.id, turnId, audio: blob });
        if (!text.trim()) {
          setState('error');
          setError('speaking.errorSilent');
          return;
        }
        save(turnId, text.trim());
        setState('idle');
        setActive(null);
      } catch {
        setState('error');
        setError('speaking.errorAsr');
      }
    };
    rec.current = r;
    r.start();
    setActive(turnId);
    setState('recording');
    setLeft(it.maxSeconds);
    const t0 = Date.now();
    timer.current = window.setInterval(() => {
      const remain = it.maxSeconds - Math.floor((Date.now() - t0) / 1000);
      setLeft(remain);
      if (remain <= 0 && r.state === 'recording') r.stop();
    }, 250);
  };
  const stop = () => rec.current?.state === 'recording' && rec.current.stop();
  const busy = state === 'recording' || state === 'transcribing';

  return (
    <>
      <QuestionPrompt number={fq.display}>
        <Rich nodes={it.prompt} />
      </QuestionPrompt>
      {!review && !supported && <p className="hint-line">{t('speaking.unsupported')}</p>}
      {!review && supported && (
        <p className="hint-line">
          {fq.turn !== undefined && it.turns[fq.turn]?.role === 'partner'
            ? t('speaking.hintPartner', { seconds: it.maxSeconds })
            : t('speaking.hintExaminer', { seconds: it.maxSeconds })}
        </p>
      )}
      <ol className="speak-turns">
        {it.turns.map((turn, i) => {
          // one page per examiner question (GitHub #74); the whole Part is still scored together
          if (fq.turn !== undefined && fq.turn !== i) return null;
          const isActive = active === turn.id;
          const said = answers[turn.id];
          return (
            <li key={turn.id} className={`speak-card ${isActive ? 'is-active' : ''} ${said ? 'is-done' : ''}`}>
              <p className="speak-count">
                {i + 1}/{it.turns.length}
                {/* PET Part 3: the AI partner speaks, the learner replies (待补组件) */}
                <span className={`speak-role ${turn.role === 'partner' ? 'is-partner' : ''}`}>{turn.role === 'partner' ? t('speaking.partner') : t('speaking.examiner')}</span>
              </p>
              {/* exam mode: the question is only heard, as in the real test (#88); practice mode and review show it */}
              {props.examMode && !review ? (
                <p className="speak-line is-hidden">{turn.role === 'partner' ? t('speaking.hiddenPartner') : t('speaking.hiddenExaminer')}</p>
              ) : (
                <p className="speak-line">{turn.text}</p>
              )}
              {said && (
                <p className="speak-said">
                  <span className="speak-said-label">{t('speaking.yourAnswer')}</span>
                  {said}
                </p>
              )}
              {isActive && state === 'error' && error && <p className="speak-error">{t(error)}</p>}
              <div className="speak-actions">
                <button className="speak-btn" onClick={() => speak(turn)} disabled={busy}>
                  <span className="speak-btn-icon">
                    <img src={listenIcon} alt="" width={40} height={40} />
                  </span>
                  {turn.role === 'partner' ? t('speaking.listenPartner') : t('speaking.listen')}
                </button>
                {!review &&
                  (isActive && state === 'recording' ? (
                    <button className="speak-btn is-recording" onClick={stop} aria-label={t('speaking.stop')}>
                      <span className="speak-btn-icon is-submit">
                        <img src={submitIcon} alt="" width={40} height={40} />
                      </span>
                      {t('speaking.recording', { s: left })}
                    </button>
                  ) : isActive && state === 'transcribing' ? (
                    <span className="speak-btn" role="status">
                      <span className="speak-btn-icon is-loading">
                        <img src={loadingIcon} alt="" width={40} height={40} />
                      </span>
                      {t('speaking.transcribing')}
                    </span>
                  ) : (
                    <button className="speak-btn" onClick={() => void start(turn.id)} disabled={!supported || busy}>
                      <span className="speak-btn-icon">
                        <img src={said || clips[turn.id] ? respeakIcon : micIcon} alt="" width={40} height={40} />
                      </span>
                      {said || clips[turn.id] ? t('speaking.rerecord') : t('speaking.answer')}
                    </button>
                  ))}
                <button className="speak-btn" disabled={!clips[turn.id] || busy} onClick={() => void new Audio(clips[turn.id]).play()}>
                  <span className="speak-btn-icon">
                    <img src={playbackIcon} alt="" width={40} height={40} />
                  </span>
                  {t('speaking.playback')}
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      {error && state !== 'error' && <p className="speak-error">{t(error)}</p>}
      {review && (fq.turn === undefined || fq.turn === it.turns.length - 1) && <JudgeVerdict {...props} />}
      {review && fq.turn !== undefined && fq.turn < it.turns.length - 1 && <p className="hint-line">{t('speaking.scoreOnLast', { page: fq.display + it.turns.length - 1 - fq.turn })}</p>}
    </>
  );
}
