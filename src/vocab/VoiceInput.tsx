import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { staticContent } from '@/lib/content';
import { recorderMime } from '@/reader/Speaking';
import micIcon from '@/assets/icons/speak-mic.svg';
import stopIcon from '@/assets/icons/speak-submit.svg';
import loadingIcon from '@/assets/icons/speak-loading.svg';

const MAX_SECONDS = 15;

/**
 * 词汇天天练 voice input (#110), only beside Chinese meanings and 中译英 answers: tap to speak, tap again (or after 15 s)
 * to stop; the text goes into the field, where it can still be edited.
 */
export function VoiceInput({
  itemId,
  questionId,
  part,
  onText,
  disabled,
}: {
  itemId: string;
  questionId: string;
  part: string;
  onText: (text: string) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const [state, setState] = useState<'idle' | 'recording' | 'busy'>('idle');
  const [error, setError] = useState('');
  const rec = useRef<MediaRecorder | null>(null);
  const timer = useRef<number>();
  const supported = !!recorderMime() && !!navigator.mediaDevices?.getUserMedia && !!staticContent.transcribe;

  useEffect(() => () => {
    window.clearTimeout(timer.current);
    rec.current?.state === 'recording' && rec.current.stop();
  }, []);

  if (!supported) return null;

  const start = async () => {
    setError('');
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError(t('vocab.voice.denied'));
      return;
    }
    const mime = recorderMime();
    const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const chunks: Blob[] = [];
    r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    r.onstop = async () => {
      stream.getTracks().forEach((tr) => tr.stop());
      window.clearTimeout(timer.current);
      setState('busy');
      try {
        const text = await staticContent.transcribe!({ itemId, questionId, part, audio: new Blob(chunks, { type: r.mimeType || mime }) });
        if (text) onText(text);
        else setError(t('vocab.voice.empty'));
      } catch {
        setError(t('vocab.voice.failed'));
      }
      setState('idle');
    };
    rec.current = r;
    r.start();
    setState('recording');
    timer.current = window.setTimeout(() => r.state === 'recording' && r.stop(), MAX_SECONDS * 1000);
  };

  return (
    <span className="voice-input">
      <button
        type="button"
        className={`voice-btn ${state === 'recording' ? 'is-recording' : ''}`}
        disabled={disabled || state === 'busy'}
        onClick={() => (state === 'recording' ? rec.current?.stop() : void start())}
        aria-label={state === 'recording' ? t('vocab.voice.stop') : t('vocab.voice.start')}
        aria-pressed={state === 'recording'}
      >
        <img src={state === 'recording' ? stopIcon : state === 'busy' ? loadingIcon : micIcon} alt="" className={state === 'busy' ? 'is-spinning' : ''} />
      </button>
      {error && (
        <span className="voice-error" role="alert">
          {error}
        </span>
      )}
    </span>
  );
}
