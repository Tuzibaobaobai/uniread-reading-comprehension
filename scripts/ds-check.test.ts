// UniRead design-system gate (docs/14 §15): pinned tokens only, no new hard-coded colours or legacy literals
import { describe, expect, it } from 'vitest';
import { check } from './ds-check';

describe('design-system compliance', () => {
  it('uses only tokens of the pinned design system and adds no literals (ratchet)', () => {
    expect(check().errors).toEqual([]);
  });
});
