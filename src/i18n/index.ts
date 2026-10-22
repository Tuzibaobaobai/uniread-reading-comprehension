import type { TFunction } from 'i18next';
import i18n, { normalizeLocale, type Locale } from './config';

export { normalizeLocale, LOCALES, DEFAULT_LOCALE, LOCALE_STORAGE_KEY, type Locale } from './config';
export type { TFunction };

/**
 * Switch the UI language. Called by the host's bundle entry (BE bridge) on `init` / `locale.set`;
 * the RC itself never listens for those messages.
 */
export function applyExamLocale(locale?: string): Promise<TFunction> {
  const lng: Locale = normalizeLocale(locale);
  if (typeof document !== 'undefined') document.documentElement.lang = lng;
  return i18n.changeLanguage(lng);
}

/** `i18n.t` for pure functions (no hooks); always reads the current language */
export const t = ((...args: Parameters<TFunction>) => i18n.t(...args)) as TFunction;

export default i18n;
