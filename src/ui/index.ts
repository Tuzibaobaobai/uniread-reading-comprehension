// RC component library (docs/14 §15): every component maps to a UniRead Figma component (reuse / extend) or an
// RC proposal — design-system/components.registry.json. Imported once by main.tsx so each component's CSS is
// present on every page, including pages that still render the legacy class names directly.
export { PlayButton } from './PlayButton/PlayButton';
export { ArrowButton } from './ArrowButton/ArrowButton';
export { QuizButton } from './QuizButton/QuizButton';
export { ScanCard } from './vocab/ScanCard/ScanCard';
export { MarkButton } from './vocab/MarkButton/MarkButton';
export { ScanSummary } from './vocab/ScanSummary/ScanSummary';
export { MarkTag } from './vocab/MarkTag/MarkTag';
export { Example } from './vocab/Example/Example';
export { TipBox } from './vocab/TipBox/TipBox';
export { CompareBlock } from './vocab/CompareBlock/CompareBlock';
export { EntryCard } from './vocab/EntryCard/EntryCard';
export { StudyToolbar, StudyLegend } from './vocab/StudyToolbar/StudyToolbar';
export { EntryDialog } from './vocab/EntryDialog/EntryDialog';
