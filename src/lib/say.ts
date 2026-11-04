import { staticContent } from '@/lib/content';
import { speakWithDevice } from '@/reader/Speaking';

let player: HTMLAudioElement | null = null;

/** the entry's generated recording (scripts/tts.mjs), else the device's voice */
export function say(text: string, audio?: { src: string }) {
  player?.pause();
  if (audio) {
    player = new Audio(staticContent.assetUrl(audio.src));
    void player.play().catch(() => speakWithDevice(text));
    return;
  }
  speakWithDevice(text);
}

export const canSpeak = () => typeof speechSynthesis !== 'undefined';
