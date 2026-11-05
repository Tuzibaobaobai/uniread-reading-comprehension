// #131: the printed IPA decides how a 词汇天天练 word is said (scripts/lexicon-pron.mjs) and the check of what a
// recording says (scripts/lib/pron-check.mjs).
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs scripts without type declarations
import { agrees, ipaToArpa, merge, toCmu, variants } from './lexicon-pron.mjs';
// @ts-expect-error plain .mjs scripts without type declarations
import { compare } from './lib/pron-check.mjs';

const arpa = (ipa: string) => toCmu(ipaToArpa(ipa));
const cmu = (s: string) => s.split(' ');

describe('printed IPA → ARPAbet', () => {
  it('keeps the printed stress and schwa', () => {
    expect(arpa('əˈfekt')).toBe('AH0 F EH1 K T');
    expect(arpa('ˈædʌlt')).toBe('AE1 D AH0 L T');
    expect(arpa('ˈzebrə')).toBe('Z EH1 B R AH0');
  });
  it('a lone weak vowel stays weak; other one-vowel words are stressed', () => {
    expect(arpa('ə')).toBe('AH0');
    expect(arpa('ðə')).toBe('DH AH0');
    expect(arpa('ɒv')).toBe('AA1 V');
  });
  it('centring diphthongs and the optional r', () => {
    expect(arpa('klɪə(r)')).toBe('K L IH1 R');
    expect(arpa('aɪˈdɪə')).toBe('AY0 D IY1 AH0');
    expect(arpa('ˈdaɪət')).toBe('D AY1 AH0 T');
    expect(arpa('ˈfaɪə(r)')).toBe('F AY1 ER0');
    expect(arpa('ˈæktə(r)')).toBe('AE1 K T ER0');
    expect(arpa('təˈwɔːd(z)')).toBe('T AH0 W AO1 D');
  });
});

describe('a dictionary pronunciation is used only when it says what the print says', () => {
  const ok = (ipa: string, c: string) => agrees(ipaToArpa(ipa), cmu(c));
  it('rejects another vowel, stress or consonant', () => {
    expect(ok('ˈzebrə', 'Z IY1 B R AH0')).toBe(false);
    expect(ok('əˈfekt', 'AE1 F EH0 K T')).toBe(false);
    expect(ok('kənˈdʌkt', 'K AA0 N D AH1 K T')).toBe(false);
    expect(ok('kləʊz', 'K L OW1 S')).toBe(false);
    expect(ok('ɑːnt', 'AE1 N T')).toBe(false); // bath words keep ɑː
    expect(ok('ˈkʌmftəbl', 'K AH1 M F ER0 T AH0 B AH0 L')).toBe(false); // an extra syllable
  });
  it('accepts US r, /djuː/ ~ /duː/ and syllabic consonants', () => {
    expect(ok('əˈfekt', 'AH0 F EH1 K T')).toBe(true);
    expect(ok('ˈæktə(r)', 'AE1 K T ER0')).toBe(true);
    expect(ok('prəˈdjuːs', 'P R AH0 D UW1 S')).toBe(true);
    expect(ok('ˈbrɪtn', 'B R IH1 T AH0 N')).toBe(true);
    expect(ok('kənˈdʌkt', 'K AH0 N D AH1 K T')).toBe(true);
  });
  it('otherwise the print, with the dictionary r where the print only leaves it out', () => {
    expect(toCmu(merge(ipaToArpa('ˈnɪəli'), cmu('N IH1 R L IY0')))).toBe('N IH1 R L IY0');
    expect(toCmu(merge(ipaToArpa('ˌhɑːdˈwɜːkɪŋ'), cmu('HH AA1 R D W ER2 K IH0 NG')))).toBe('HH AA2 R D W ER1 K IH0 NG');
  });
});

describe('headword variants', () => {
  it('splits the printed forms', () => {
    expect(variants('a (an)')).toEqual(['a', 'an']);
    expect(variants('toward(s)')).toEqual(['toward', 'towards']);
    expect(variants('although / though')).toEqual(['although', 'though']);
    expect(variants('AI (= artificial intelligence)')).toEqual(['AI']);
  });
});

describe('what a recording says vs the print (phoneme recogniser output)', () => {
  it('flags affect said with a full first vowel, passes the schwa', () => {
    expect(compare(['AH0 F EH1 K T'], 'ɛ f ɛ k t')).not.toEqual([]);
    expect(compare(['AH0 F EH1 K T'], 'a f ɛ k t')).not.toEqual([]);
    expect(compare(['AH0 F EH1 K T'], 'ɐ f ɛ k t')).toEqual([]);
  });
  it('tolerates the recogniser’s dark l and final schwa', () => {
    expect(compare(['AE1 D AH0 L T'], 'a r o l t')).toEqual([]);
    expect(compare(['B AH0 N AA1 N AH0'], 'b ə n aː n a')).toEqual([]);
  });
  it('checks every printed pronunciation of a variant headword in turn', () => {
    expect(compare(['EY1', 'AH0'], 'eɪ ɐ')).toEqual([]);
    expect(compare(['EY1', 'AH0'], 'eɪ eɪ')).not.toEqual([]);
  });
});
