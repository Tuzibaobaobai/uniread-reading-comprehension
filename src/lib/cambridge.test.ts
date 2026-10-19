import { describe, expect, it } from 'vitest';
import { grade, toScale } from './cambridge';

describe('Cambridge English Scale (A2 Key practice-test anchors)', () => {
  it('hits the published anchor points', () => {
    expect(toScale('reading', 28)).toBe(140);
    expect(toScale('reading', 20)).toBe(120);
    expect(toScale('writing', 18)).toBe(120);
    expect(toScale('listening', 17)).toBe(120);
    expect(toScale('listening', 23)).toBe(140);
    expect(toScale('speaking', 27)).toBe(120);
    expect(toScale('speaking', 41)).toBe(140);
  });
  it('interpolates, caps at 150 and reports nothing below 82', () => {
    expect(toScale('reading', 24)).toBe(130);
    expect(toScale('reading', 30)).toBe(150);
    expect(toScale('listening', 25)).toBe(150);
    expect(toScale('reading', 6)).toBeNull();
  });
  it('maps scale scores to A2 Key result bands', () => {
    expect(grade(141)).toBe('Grade A（B1）');
    expect(grade(135)).toBe('Grade B（A2）');
    expect(grade(120)).toBe('Grade C（A2）');
    expect(grade(105)).toBe('A1');
  });
});
