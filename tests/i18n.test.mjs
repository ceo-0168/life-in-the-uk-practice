// Translation integrity. These fail if a language falls out of sync with English, a placeholder is lost,
// the two Chinese scripts get mixed, or the code asks for a string that doesn't exist.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import en from '../js/i18n/en.js';
import zhHant from '../js/i18n/zh-Hant.js';
import zhHans from '../js/i18n/zh-Hans.js';
import { t, tn, setLang, getLang, detectLang, resolveLang, LANGS } from '../js/i18n.js';
import { sessionLabel } from '../js/ui.js';
import { normalizeState } from '../js/engine.js';

const root = new URL('..', import.meta.url).pathname;
const langs = { 'zh-Hant': zhHant, 'zh-Hans': zhHans };
const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const base = (k) => k.replace(/\.(one|other)$/, '');
const isPlural = (k) => /\.(one|other)$/.test(k);

test('English strings are non-empty', () => {
  for (const [k, v] of Object.entries(en)) assert.ok(typeof v === 'string' && v.length > 0, k);
});

for (const [code, dict] of Object.entries(langs)) {
  test(`${code}: defines every English key (plurals: the .other form), and nothing extra`, () => {
    const expected = new Set();
    for (const k of Object.keys(en)) expected.add(isPlural(k) ? `${base(k)}.other` : k);
    const have = new Set(Object.keys(dict));
    const missing = [...expected].filter((k) => !have.has(k));
    const extra = [...have].filter((k) => !expected.has(k));
    assert.deepEqual(missing, [], `missing in ${code}`);
    assert.deepEqual(extra, [], `unexpected in ${code} (Chinese has no .one form)`);
  });

  test(`${code}: every {placeholder} matches English exactly`, () => {
    for (const [k, v] of Object.entries(dict)) {
      const enKey = en[k] !== undefined ? k : `${base(k)}.other`;
      assert.deepEqual(placeholders(v), placeholders(en[enKey]), `${code} ${k}`);
    }
  });

  test(`${code}: strings are actually translated`, () => {
    for (const [k, v] of Object.entries(dict)) {
      assert.ok(v.length > 0, `${code} ${k} is empty`);
      const enKey = en[k] !== undefined ? k : `${base(k)}.other`;
      const english = en[enKey].replace(/\{\w+\}/g, '');
      if (/[A-Za-z]{3,}/.test(english)) assert.notEqual(v, en[enKey], `${code} ${k} was left in English`);
    }
  });
}

// Characters that differ between the scripts. Catches Simplified creeping into Traditional and vice versa.
const PAIRS = ['題题', '設设', '備备', '導导', '練练', '習习', '錯错', '對对', '確确', '認认', '載载', '顯显', '統统', '計计', '進进',
  '這这', '個个', '時时', '間间', '會会', '應应', '無无', '廣广', '點点', '選选', '項项', '過过', '試试', '結结', '級级', '關关',
  '開开', '務务', '還还', '擇择', '隨随', '機机', '數数', '據据', '錄录', '記记', '庫库', '檔档', '網网', '絡络', '複复', '標标',
  '實实', '現现', '資资', '訊讯', '儲储', '轉转', '換换', '覽览', '裝装', '來来', '後后', '麼么', '體体', '續续', '帳账', '歡欢', '譯译', '說说'];
const hantOnly = new Set(PAIRS.map((p) => p[0]));
const hansOnly = new Set(PAIRS.map((p) => p[1]));

test('Traditional Chinese contains no Simplified-only characters', () => {
  for (const [k, v] of Object.entries(zhHant)) for (const ch of v) assert.ok(!hansOnly.has(ch), `zh-Hant ${k} contains simplified "${ch}"`);
});
test('Simplified Chinese contains no Traditional-only characters', () => {
  for (const [k, v] of Object.entries(zhHans)) for (const ch of v) assert.ok(!hantOnly.has(ch), `zh-Hans ${k} contains traditional "${ch}"`);
});

test('every translation key used by the code exists in English', () => {
  const files = [...readdirSync(join(root, 'js')).filter((f) => f.endsWith('.js') && f !== 'i18n.js').map((f) => `js/${f}`),
    ...readdirSync(join(root, 'js/views')).map((f) => `js/views/${f}`)];
  const used = new Set();
  for (const f of files) {
    const src = readFileSync(join(root, f), 'utf8');
    for (const m of src.matchAll(/\b(tn?)\(\s*(['"])([A-Za-z0-9_.]+)\2/g)) used.add(`${m[1]}:${m[3]}`);
    for (const m of src.matchAll(/\[\s*'[^']*',\s*'([a-z]+\.[A-Za-z0-9_.]+)'/g)) used.add(`t:${m[1]}`);
  }
  for (const lvl of ['ready', 'close', 'building']) used.add(`t:verdict.${lvl}`);
  for (const k of ['pass', 'good', 'home']) { used.add(`t:support.${k}.title`); used.add(`t:support.${k}.body`); }
  const bad = [...used].filter((u) => {
    const [kind, key] = u.split(':');
    return kind === 'tn' ? en[`${key}.other`] === undefined : en[key] === undefined;
  });
  assert.deepEqual(bad, []);
});

test('t() fills parameters and falls back to English, then to the key', () => {
  setLang('en');
  assert.equal(t('home.answeredToday', { done: 3, goal: 20 }), '3/20 answered today');
  assert.equal(t('no.such.key'), 'no.such.key');
  setLang('zh-Hant');
  assert.equal(t('home.answeredToday', { done: 3, goal: 20 }), '今日已答 3/20 題');
  setLang('xx'); // unknown language falls back
  assert.equal(getLang(), 'en');
});

test('plural rules: English picks one/other, Chinese always uses .other', () => {
  setLang('en');
  assert.equal(tn('count.reviews', 1), '1 review');
  assert.equal(tn('count.reviews', 2), '2 reviews');
  assert.equal(tn('browse.count', 0), '0 questions');
  setLang('zh-Hant');
  assert.equal(tn('count.reviews', 1), '1 題複習');
  assert.equal(tn('count.reviews', 5), '5 題複習');
  setLang('zh-Hans');
  assert.equal(tn('home.daysToTest', 1), '距离考试还有 1 天');
  setLang('en');
});

test('browser language detection picks the right Chinese script', () => {
  assert.equal(detectLang(['zh-HK']), 'zh-Hant');
  assert.equal(detectLang(['zh-TW']), 'zh-Hant');
  assert.equal(detectLang(['zh-MO']), 'zh-Hant');
  assert.equal(detectLang(['zh-Hant-HK']), 'zh-Hant');
  assert.equal(detectLang(['zh-Hant']), 'zh-Hant');
  assert.equal(detectLang(['zh-CN']), 'zh-Hans');
  assert.equal(detectLang(['zh-SG']), 'zh-Hans');
  assert.equal(detectLang(['zh-Hans-CN']), 'zh-Hans');
  assert.equal(detectLang(['zh']), 'zh-Hans');
  assert.equal(detectLang(['en-GB']), 'en');
  assert.equal(detectLang(['fr-FR', 'zh-HK', 'en']), 'zh-Hant', 'first supported language wins');
  assert.equal(detectLang(['fr-FR']), 'en');
  assert.equal(detectLang([]), 'en');
  assert.equal(resolveLang('auto', ['zh-HK']), 'zh-Hant');
  assert.equal(resolveLang('en', ['zh-HK']), 'en', 'an explicit choice beats the browser');
  assert.equal(resolveLang('zh-Hans', ['en']), 'zh-Hans');
  assert.equal(resolveLang(undefined, ['zh-CN']), 'zh-Hans');
});

test('saved session labels (stored in English) display in the current language', () => {
  const labels = ["Today's session", 'New questions', 'First steps', 'Review', 'Weak spots', 'Most missed', 'Saved questions', 'Random mix', 'Marathon', 'Retry missed', 'Mock test', 'Exam 7'];
  setLang('en');
  assert.equal(sessionLabel('Exam 7'), 'Exam 7');
  assert.equal(sessionLabel("Today's session"), "Today's session");
  for (const code of ['zh-Hant', 'zh-Hans']) {
    setLang(code);
    for (const l of labels) assert.notEqual(sessionLabel(l), l, `${code}: "${l}" not translated`);
    assert.match(sessionLabel('Exam 7'), /7/);
  }
  setLang('en');
  assert.equal(sessionLabel('Something custom'), 'Something custom', 'unknown labels pass through');
});

test('the language setting is validated', () => {
  assert.equal(normalizeState({ attempts: [], sessions: [], settings: { lang: 'zh-Hant' } }).state.settings.lang, 'zh-Hant');
  assert.equal(normalizeState({ attempts: [], sessions: [], settings: { lang: 'klingon' } }).state.settings.lang, 'auto');
  assert.equal(normalizeState({ attempts: [], sessions: [] }).state.settings.lang, 'auto');
});

test('three languages are offered, each named in its own script', () => {
  assert.deepEqual(LANGS.map((l) => l.code), ['en', 'zh-Hant', 'zh-Hans']);
  assert.deepEqual(LANGS.map((l) => l.label), ['English', '繁體中文', '简体中文']);
});

test('the Chinese READMEs keep to their own script and their images exist', () => {
  for (const [file, onlyChars, forbidden] of [['README.zh-Hant.md', hantOnly, hansOnly], ['README.zh-Hans.md', hansOnly, hantOnly]]) {
    const text = readFileSync(join(root, file), 'utf8');
    // lines that name the other language (the switcher, the language note) legitimately use its own script
    const body = text.split('\n').filter((l) => !l.includes('README.zh-') && !l.includes('简体中文') && !l.includes('繁體中文')).join('\n');
    for (const ch of body) assert.ok(!forbidden.has(ch), `${file} contains "${ch}" from the other script`);
    assert.ok([...body].some((ch) => onlyChars.has(ch)), `${file} should actually use its own script`);
    for (const [, img] of text.matchAll(/src="([^"]+\.png)"/g)) readFileSync(join(root, img)); // throws if missing
    assert.match(text, /README\.md/, `${file} links back to English`);
  }
  const en = readFileSync(join(root, 'README.md'), 'utf8');
  assert.match(en, /README\.zh-Hant\.md/);
  assert.match(en, /README\.zh-Hans\.md/);
});

test('no hard-coded English interface text in the code (everything goes through t())', () => {
  // Session labels are stored in English on purpose and translated for display by sessionLabel().
  const STORED_LABELS = new Set(["Today's session", 'New questions', 'First steps', 'Review', 'Weak spots', 'Most missed', 'Saved questions',
    'Random mix', 'Marathon', 'Retry missed', 'Mock test']);
  const files = ['js/main.js', 'js/session.js', 'js/ui.js', ...readdirSync(join(root, 'js/views')).map((f) => `js/views/${f}`)];
  const offenders = [];
  for (const f of files) {
    const src = readFileSync(join(root, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    src.split('\n').forEach((line, i) => {
      const code = line.replace(/\/\/.*$/, '').replace(/\btn?\(\s*'[^']*'/g, 'T()');
      for (const m of code.matchAll(/(['"`])((?:(?!\1).)*)\1/g)) {
        const str = m[2];
        if (/^[A-Z][a-z]+(?:[ '’,.-]+[A-Za-z]+)+/.test(str) && str.includes(' ') && !STORED_LABELS.has(str)) offenders.push(`${f}:${i + 1} "${str.slice(0, 50)}"`);
      }
    });
  }
  assert.deepEqual(offenders, [], 'wrap these in t() and add the key to every language');
});
