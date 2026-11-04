import { Book, Cards, Question } from '@/components/Icons';
import './StepIcon.css';

export type Step = 'scan' | 'study' | 'quiz';

/**
 * ui/StepIcon — extends UniRead UIKit-LearnNav `icons` (8162:32091; proposal RC · Proposed 19447:751). Variant icon:
 * Quiz (existing) + Scan (速览) / Study (学习) to be drawn by the designer; the code uses placeholders until then.
 * Sized and coloured by StepTabs.
 */
export function StepIcon({ icon }: { icon: Step }) {
  return icon === 'scan' ? <Cards /> : icon === 'study' ? <Book /> : <Question />;
}
