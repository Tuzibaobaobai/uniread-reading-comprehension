import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Rich } from '@/components/Rich';
import { staticContent } from '@/lib/content';
import { HintText } from '@/ui/common/HintText/HintText';
import { Message } from '@/ui/Message/Message';
import { SpeakCard, SpeakTurns } from '@/ui/SpeakCard/SpeakCard';
import { SpeakButton } from '@/ui/SpeakButton/SpeakButton';
import { ListenButton } from '@/ui/ListenButton/ListenButton';
import { PlaybackButton } from '@/ui/PlaybackButton/PlaybackButton';
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
export function speakWithDevice(text: string) {
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
 * 口语 — ui/SpeakCard (Figma UIkit-Speak subtitle-SpeakMode 9017:40624): one card per examiner line
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
  /** recordings stopped to be thrown away (× cancel, ↻ restart) */
  const discarded = useRef(new WeakSet<MediaRecorder>());
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
      if (discarded.current.has(r)) {
        // cancelled or restarted: keep the earlier take (if any), nothing is sent for recognition
        if (rec.current === r) {
          setState('idle');
          setActive(null);
        }
        return;
      }
      const blob = new Blob(chunks, { type: r.mimeType || mime });
      setClips((c) => ({ ...c, [turnId]: URL.createObjectURL(blob) }));
      setState('transcribing');
      try {
        const send = () => staticContent.speak!({ itemId: item.id, questionId: fq.q.id, turnId, audio: blob });
        // one automatic second try with the same recording (a busy or briefly unreachable service), then the message
        const text = await send().catch(() => new Promise<string>((ok, no) => window.setTimeout(() => send().then(ok, no), 1500)));
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
  /** × — throw the recording away */
  const cancel = () => {
    if (rec.current?.state !== 'recording') return;
    discarded.current.add(rec.current);
    rec.current.stop();
  };
  /** ↻ — throw it away and record again */
  const restart = (turnId: string) => {
    cancel();
    void start(turnId);
  };
  const busy = state === 'recording' || state === 'transcribing';

  return (
    <>
      <QuestionPrompt number={fq.display}>
        <Rich nodes={it.prompt} />
      </QuestionPrompt>
      {!review && !supported && <HintText>{t('speaking.unsupported')}</HintText>}
      {!review && supported && (
        <HintText>
          {fq.turn !== undefined && it.turns[fq.turn]?.role === 'partner'
            ? t('speaking.hintPartner', { seconds: it.maxSeconds })
            : t('speaking.hintExaminer', { seconds: it.maxSeconds })}
        </HintText>
      )}
      <SpeakTurns>
        {it.turns.map((turn, i) => {
          // one page per examiner question (GitHub #74); the whole Part is still scored together
          if (fq.turn !== undefined && fq.turn !== i) return null;
          const isActive = active === turn.id;
          const said = answers[turn.id];
          const partner = turn.role === 'partner';
          // exam mode: the question is only heard, as in the real test (#88); practice mode and review show it
          const hidden = !!props.examMode && !review;
          return (
            <SpeakCard
              key={turn.id}
              index={i + 1}
              total={it.turns.length}
              role={partner ? 'partner' : 'examiner'}
              roleLabel={partner ? t('speaking.partner') : t('speaking.examiner')}
              promptHidden={hidden}
              prompt={hidden ? (partner ? t('speaking.hiddenPartner') : t('speaking.hiddenExaminer')) : turn.text}
              answer={said}
              answerLabel={t('speaking.yourAnswer')}
              active={isActive}
              notice={isActive && state === 'error' && error && <Message>{t(error)}</Message>}
              actions={
                <>
                  <ListenButton label={partner ? t('speaking.listenPartner') : t('speaking.listen')} onListen={() => speak(turn)} disabled={busy} />
                  {!review &&
                    (isActive && state === 'recording' ? (
                      <SpeakButton
                        state="recording"
                        label={t('speaking.recording', { s: left })}
                        stopLabel={t('speaking.stop')}
                        elapsed={1 - left / it.maxSeconds}
                        cancel={{ label: t('speaking.cancel'), onClick: cancel }}
                        restart={{ label: t('speaking.restart'), onClick: () => restart(turn.id) }}
                        onStart={() => void start(turn.id)}
                        onStop={stop}
                      />
                    ) : isActive && state === 'transcribing' ? (
                      <SpeakButton state="recognising" label={t('speaking.transcribing')} stopLabel={t('speaking.stop')} onStart={() => void start(turn.id)} onStop={stop} />
                    ) : (
                      <SpeakButton
                        again={!!(said || clips[turn.id])}
                        label={said || clips[turn.id] ? t('speaking.rerecord') : t('speaking.answer')}
                        stopLabel={t('speaking.stop')}
                        disabled={!supported || busy}
                        onStart={() => void start(turn.id)}
                        onStop={stop}
                      />
                    ))}
                  <PlaybackButton label={t('speaking.playback')} disabled={!clips[turn.id] || busy} onPlay={() => void new Audio(clips[turn.id]).play()} />
                </>
              }
            />
          );
        })}
      </SpeakTurns>
      {error && state !== 'error' && <Message>{t(error)}</Message>}
      {review && (fq.turn === undefined || fq.turn === it.turns.length - 1) && <JudgeVerdict {...props} />}
      {review && fq.turn !== undefined && fq.turn < it.turns.length - 1 && <HintText>{t('speaking.scoreOnLast', { page: fq.display + it.turns.length - 1 - fq.turn })}</HintText>}
    </>
  );
}
