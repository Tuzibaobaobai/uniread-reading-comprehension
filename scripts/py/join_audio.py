"""Join word clips into one MP3 (#131): a word printed with more than one IPA is said once per IPA, each pronunciation
synthesised on its own (in one request the voice says a spelling only one way) and joined here with a short pause.
   .work/venv-pron/bin/python scripts/py/join_audio.py <out.mp3> <part.wav>...
Each part's leading / trailing silence is trimmed; the clip starts and ends with LEAD of silence, parts are GAP apart.
Setup: the venv of scripts/lib/pron-check.mjs plus `pip install lameenc`."""
import sys
import numpy as np, soundfile as sf, lameenc

LEAD, GAP, THRESHOLD = 0.3, 0.45, 0.01  # seconds, seconds, amplitude (of 1.0) counted as sound


def trimmed(path):
    a, sr = sf.read(path, dtype='float32')
    if a.ndim > 1:
        a = a.mean(axis=1)
    loud = np.flatnonzero(np.abs(a) > THRESHOLD)
    if not len(loud):
        return a[:0], sr
    pad = int(0.03 * sr)  # keep the soft onset / release around the loud part
    return a[max(0, loud[0] - pad) : loud[-1] + pad], sr


out, files = sys.argv[1], sys.argv[2:]
parts = [trimmed(f) for f in files]
sr = parts[0][1]
assert all(p[1] == sr for p in parts), 'parts differ in sample rate'
silence = lambda s: np.zeros(int(s * sr), dtype='float32')
audio = [silence(LEAD)]
for i, (a, _) in enumerate(parts):
    if i:
        audio.append(silence(GAP))
    audio.append(a)
audio.append(silence(LEAD))
pcm = (np.clip(np.concatenate(audio), -1, 1) * 32767).astype('<i2').tobytes()
enc = lameenc.Encoder()
enc.set_bit_rate(64)
enc.set_in_sample_rate(sr)
enc.set_channels(1)
enc.set_quality(2)
with open(out, 'wb') as f:
    f.write(enc.encode(pcm) + enc.flush())
