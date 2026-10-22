/**
 * i18next setup (GitHub #106): every user-visible UI string comes from src/i18n/locales/*.json.
 * zh-CN is the product default and the fallback. The standalone preview may start in the language saved under
 * localStorage `rc.locale`; there is no browser-language detection. Hosts switch language only through
 * `applyExamLocale` (src/i18n/index.ts) — this package never listens for window / port messages.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';

export const LOCALES = ['zh-CN', 'en-US'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'zh-CN';
/** standalone preview only: the initial language */
export const LOCALE_STORAGE_KEY = 'rc.locale';

/** `en*` → en-US; everything else (including empty) → zh-CN */
export function normalizeLocale(raw?: string | null): Locale {
  return /^en/i.test(raw?.trim() ?? '') ? 'en-US' : 'zh-CN';
}

function storedLocale(): string | undefined {
  try {
    // browsers only (Node's experimental localStorage warns when touched)
    return typeof window === 'undefined' ? undefined : (window.localStorage.getItem(LOCALE_STORAGE_KEY) ?? undefined);
  } catch {
    return undefined;
  }
}

const initial = normalizeLocale(storedLocale());

void i18n.use(initReactI18next).init({
  resources: { 'zh-CN': { translation: zhCN }, 'en-US': { translation: enUS } },
  lng: initial,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: [...LOCALES],
  // resources are bundled: initialise synchronously so the first render already has its strings
  initAsync: false,
  // React escapes already
  interpolation: { escapeValue: false },
});

if (typeof document !== 'undefined') document.documentElement.lang = initial;

export default i18n;
