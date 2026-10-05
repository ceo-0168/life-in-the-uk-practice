// Interface translations. Only the app's own text is translated; the questions, answer options and
// handbook explanations stay in English on purpose, because the real test is taken in English.
//
// t('key', {n: 3})   looks up a string and fills {n}
// tn('key', 3)       picks 'key.one' / 'key.other' by the language's plural rules, then fills {n}
// A missing key falls back to English, then to the key itself, so a gap never breaks the screen.
import en from './i18n/en.js';
import zhHant from './i18n/zh-Hant.js';
import zhHans from './i18n/zh-Hans.js';

export const DICTS = { en, 'zh-Hant': zhHant, 'zh-Hans': zhHans };
export const LANGS = [
  { code: 'en', label: 'English', html: 'en-GB', locale: 'en-GB' },
  { code: 'zh-Hant', label: '繁體中文', html: 'zh-Hant', locale: 'zh-HK' },
  { code: 'zh-Hans', label: '简体中文', html: 'zh-Hans', locale: 'zh-CN' },
];

let current = 'en';

/** Map a browser language list (e.g. ['zh-HK', 'en']) to one of our language codes. */
export function detectLang(languages = (typeof navigator !== 'undefined' ? navigator.languages : []) || []) {
  for (const raw of languages || []) {
    const l = String(raw).toLowerCase();
    if (l.startsWith('zh')) {
      // Traditional: Hong Kong, Macau, Taiwan, or an explicit Hant script. Everything else Chinese is Simplified.
      return /hant|-hk|-mo|-tw/.test(l) ? 'zh-Hant' : 'zh-Hans';
    }
    if (l.startsWith('en')) return 'en';
  }
  return 'en';
}

/** A saved setting is 'auto' or a language code; returns the language to use. */
export function resolveLang(setting, languages) {
  return DICTS[setting] ? setting : detectLang(languages);
}

export function setLang(code) {
  current = DICTS[code] ? code : 'en';
  if (typeof document !== 'undefined') document.documentElement.lang = LANGS.find((l) => l.code === current).html;
  return current;
}

export const getLang = () => current;
export const getLocale = () => LANGS.find((l) => l.code === current).locale;

const fill = (s, params) => (params ? s.replace(/\{(\w+)\}/g, (_, k) => (params[k] ?? '')) : s);

export function t(key, params) {
  const s = DICTS[current][key] ?? en[key];
  return s === undefined ? key : fill(s, params);
}

/** Plural-aware lookup: English has .one/.other; Chinese only .other. */
export function tn(key, n, params) {
  const cat = new Intl.PluralRules(getLocale()).select(n);
  const dict = DICTS[current];
  const s = dict[`${key}.${cat}`] ?? dict[`${key}.other`] ?? en[`${key}.${cat}`] ?? en[`${key}.other`];
  return s === undefined ? key : fill(s, { n, ...params });
}
