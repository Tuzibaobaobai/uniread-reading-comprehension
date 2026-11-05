import { staticContent } from '@/lib/content';
import { speakWithDevice } from '@/reader/Speaking';

let player: HTMLAudioElement | null = null;

/** The entry's generated recording (scripts/tts.mjs), else — only when it has none — the device's voice.
 *  A recording that fails to play does NOT fall back to the device's voice (#131): that voice reads the spelling its own
 *  way (affect /ˈæfekt/, adult /əˈdʌlt/), not the book's IPA the recordings are made to follow. */
export function say(text: string, audio?: { src: string }) {
  player?.pause();
  if (audio) {
    player = new Audio(staticContent.assetUrl(audio.src));
    void player.play().catch((e: unknown) => console.warn(`recording ${audio.src} did not play`, e));
    return;
  }
  speakWithDevice(text);
}

export const canSpeak = () => typeof speechSynthesis !== 'undefined';
