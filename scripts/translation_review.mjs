#!/usr/bin/env node
// Builds docs/TRANSLATION_REVIEW.md: every interface string in English, Traditional and Simplified Chinese,
// side by side, so a native reader can review them. Regenerate with `npm run review:i18n`.
import { writeFileSync } from 'node:fs';
import en from '../js/i18n/en.js';
import hant from '../js/i18n/zh-Hant.js';
import hans from '../js/i18n/zh-Hans.js';

const SECTIONS = [
  ['app', 'App shell'], ['nav', 'Navigation'], ['countdown', 'Navigation'], ['common', 'App shell'], ['dialog', 'App shell'],
  ['error', 'App shell'], ['update', 'App shell'], ['lang', 'App shell'], ['time', 'Time words'],
  ['kind', 'Question and session words'], ['q', 'Question and session words'], ['status', 'Question and session words'],
  ['legend', 'Question and session words'], ['verdict', 'Question and session words'], ['count', 'Question and session words'],
  ['home', 'Home'], ['tile', 'Home'], ['practice', 'Practice menu'], ['row', 'Practice menu'], ['sess', 'During a session'],
  ['res', 'Results'], ['stats', 'Stats'], ['browse', 'Questions browser'], ['welcome', 'Welcome screen'],
  ['support', 'Support card'], ['st', 'Settings'], ['theme', 'Settings'], ['err', 'Error messages'], ['store', 'Error messages'],
];
const sectionOf = (key) => (SECTIONS.find(([p]) => key.split('.')[0] === p) || [, 'Other'])[1];
const base = (k) => k.replace(/\.(one|other)$/, '');

// One row per message; English plural pairs are shown on one row (Chinese has a single form).
const rows = [];
const seen = new Set();
for (const key of Object.keys(en)) {
  const b = base(key);
  if (seen.has(b)) continue;
  seen.add(b);
  const plural = key !== b;
  const enText = plural ? `${en[`${b}.one`]}<br>${en[`${b}.other`]}` : en[key];
  const zk = plural ? `${b}.other` : key;
  rows.push({ section: sectionOf(key), key: b, en: enText, hant: hant[zk], hans: hans[zk] });
}

const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const order = [...new Set(rows.map((r) => r.section))];

const GLOSSARY = [
  ['Life in the UK test', '英國生活考試', '英国生活测试', 'Traditional uses 考試, Simplified uses 测试 (the usual wording in each region)'],
  ['mock test', '模擬考試', '模拟考试', ''],
  ['the real test', '正式考試', '正式考试', ''],
  ['handbook (the official book)', '官方手冊', '官方手册', ''],
  ['explanation', '解釋', '解析', 'Simplified 解析 is the usual study-guide word'],
  ['spaced repetition', '間隔複習', '间隔复习', ''],
  ['Exam 5 (one of the 18 mock papers)', '試卷 5', '试卷 5', 'To avoid confusion with the real "考試"'],
  ['Home (page)', '主頁', '首页', ''],
  ['Mastered / Learning / Missed / Not seen', '已掌握 / 學習中 / 答錯 / 未做過', '已掌握 / 学习中 / 答错 / 未做过', ''],
  ['Save / Saved (bookmark a question)', '收藏 / 已收藏', '收藏 / 已收藏', ''],
  ['Looks wrong? (report an answer)', '答案有誤？', '答案有误？', ''],
  ['Import / Replace / Restore', '匯入 / 取代 / 還原', '导入 / 替换 / 还原', 'Hong Kong and Taiwan say 匯入; mainland says 导入'],
  ['Privacy', '私隱', '隐私', '私隱 is the Hong Kong spelling; Taiwan writes 隱私'],
  ['Buy me a coffee', '請我喝杯咖啡', '请我喝杯咖啡', ''],
  ['Home Office', '英國內政部', '英国内政部', ''],
];

let md = `# Translation review

Every interface string, in English, Traditional Chinese (繁體中文, written to read naturally in Hong Kong) and
Simplified Chinese (简体中文). **Questions, answer options and handbook explanations are not translated.** They stay in
English on purpose, because the real test is taken in English.

${rows.length} messages. Plural forms: English has singular and plural (shown on two lines); Chinese has one form.

## How to review

- Read the Chinese columns against the English. Flag anything that is wrong, awkward, too literal or too formal.
- Keep \`{placeholders}\` such as \`{n}\` or \`{when}\` exactly as they are: the app fills them in.
- Send corrections as "key → better wording" (for example \`home.quick → 快速練習\`). The key is in the first column.

## Terms to confirm

| Concept | 繁體中文 | 简体中文 | Note |
|---|---|---|---|
${GLOSSARY.map(([c, a, b, n]) => `| ${esc(c)} | ${esc(a)} | ${esc(b)} | ${esc(n)} |`).join('\n')}

`;
for (const sec of order) {
  md += `## ${sec}\n\n| Key | English | 繁體中文 | 简体中文 |\n|---|---|---|---|\n`;
  for (const r of rows.filter((x) => x.section === sec)) md += `| \`${r.key}\` | ${esc(r.en)} | ${esc(r.hant)} | ${esc(r.hans)} |\n`;
  md += '\n';
}
writeFileSync(new URL('../docs/TRANSLATION_REVIEW.md', import.meta.url), md);
writeFileSync(new URL('./.review-data.json', import.meta.url), JSON.stringify({ rows, glossary: GLOSSARY, order }, null, 1));
console.log(`docs/TRANSLATION_REVIEW.md: ${rows.length} messages in ${order.length} sections`);
