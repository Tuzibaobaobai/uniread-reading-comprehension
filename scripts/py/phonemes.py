"""Phoneme recogniser for the 词汇天天练 audio check (#131): prints, per audio file, the IPA phones the clip actually says.
   .work/venv-pron/bin/python scripts/py/phonemes.py <file.mp3>...   → JSON lines {"file", "phones"}
Model: facebook/wav2vec2-lv-60-espeak-cv-ft (espeak IPA, no stress marks). Setup: see scripts/check-pron-audio.mjs."""
import json, subprocess, sys, tempfile, os, warnings
warnings.filterwarnings('ignore')
import numpy as np, soundfile as sf, torch
from transformers import Wav2Vec2ForCTC, Wav2Vec2FeatureExtractor
from huggingface_hub import hf_hub_download

MODEL = 'facebook/wav2vec2-lv-60-espeak-cv-ft'
fx = Wav2Vec2FeatureExtractor.from_pretrained(MODEL)
# decode CTC by hand: the model's tokenizer wants espeak/phonemizer installed, which decoding does not need
vocab = {i: t for t, i in json.load(open(hf_hub_download(MODEL, 'vocab.json'))).items()}
def decode(ids):
    out, prev = [], None
    for i in ids:
        if i != prev and vocab[i] not in ('<pad>', '<s>', '</s>', '<unk>'):
            out.append(vocab[i])
        prev = i
    return ' '.join(out)
model = Wav2Vec2ForCTC.from_pretrained(MODEL).eval()
tmp = tempfile.mkdtemp()
for f in sys.argv[1:]:
    wav = os.path.join(tmp, 'a.wav')
    subprocess.run(['afconvert', '-f', 'WAVE', '-d', 'LEI16@16000', '-c', '1', f, wav], check=True)
    audio, sr = sf.read(wav, dtype='float32')
    inputs = fx(audio, sampling_rate=16000, return_tensors='pt')
    with torch.no_grad():
        ids = torch.argmax(model(inputs.input_values).logits, dim=-1)
    print(json.dumps({'file': f, 'phones': decode(ids[0].tolist())}, ensure_ascii=False), flush=True)
