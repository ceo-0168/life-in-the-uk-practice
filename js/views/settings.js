import * as store from '../store.js';
import { daysToTest, SETTING_CHOICES } from '../engine.js';
import { h, icon, toast, confirmDialog, timeAgo } from '../ui.js';
import { t, tn, getLocale } from '../i18n.js';
import { bank } from '../ctx.js';
import { coffeeButton } from './support.js';
import { langPicker } from './lang.js';

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;

function backupFile() {
  const text = JSON.stringify(store.exportData(), null, 1);
  const name = `life-in-uk-progress-${new Date().toISOString().slice(0, 10)}.json`;
  return { text, name, file: new File([text], name, { type: 'application/json' }) };
}

const SOURCE_URL = 'https://github.com/ceo-0168/life-in-the-uk-practice';
const UPSTREAM = 'DHKLeung/life-in-the-uk-test';

/** The credits line, with the upstream project as a link. Small and muted: attribution without leading with it. */
function credits() {
  const [before, after = ''] = t('st.about.credits', { src: '\u0000' }).split('\u0000');
  return h('p', { class: 'credits' }, before,
    h('a', { href: `https://github.com/${UPSTREAM}`, target: '_blank', rel: 'noopener noreferrer' }, UPSTREAM), after);
}

const fmtWhen = (ts) => new Date(ts).toLocaleString(getLocale(), { dateStyle: 'medium', timeStyle: 'short' });
const REASON_KEY = { 'before erase': 'st.reason.erase', 'before import': 'st.reason.import', 'before restore': 'st.reason.restore' };

export function renderSettings(root, { applyTheme }) {
  const state = store.getState();
  const s = state.settings;
  const redraw = () => renderSettings(root, { applyTheme });

  const row = (label, hint, control) => h('div', { class: 'setting' },
    h('div', { class: 'setting-main' }, h('div', { class: 'setting-label' }, label), hint ? h('div', { class: 'setting-hint' }, hint) : null), control);

  const toggle = (key, label, hint) => {
    const input = h('input', { type: 'checkbox', checked: !!s[key], onChange: (e) => store.setSettings({ [key]: e.target.checked }), 'aria-label': label });
    return row(label, hint, h('label', { class: 'switch' }, input, h('span', { class: 'slider' })));
  };

  const dateInput = h('input', { class: 'input', type: 'date', value: s.testDate || '', 'aria-label': t('st.testDate'), onChange: (e) => { store.setSettings({ testDate: e.target.value }); redraw(); } });
  const left = daysToTest(s.testDate);

  const goal = h('select', { class: 'input', 'aria-label': t('st.dailyGoal'), onChange: (e) => store.setSettings({ dailyGoal: Number(e.target.value) }) },
    SETTING_CHOICES.dailyGoal.map((n) => h('option', { value: String(n), selected: n === s.dailyGoal }, t('st.goalOption', { n }))));

  const theme = h('div', { class: 'seg', role: 'group', 'aria-label': t('st.theme') },
    [['auto', 'theme.auto'], ['light', 'theme.light'], ['dark', 'theme.dark']].map(([k, key]) => h('button', {
      class: 'seg-btn' + (s.theme === k ? ' on' : ''), type: 'button', 'aria-pressed': s.theme === k ? 'true' : 'false',
      onClick: () => { store.setSettings({ theme: k }); applyTheme(); redraw(); },
    }, t(key))));

  // ----- backup -----
  const fileInput = h('input', { type: 'file', accept: 'application/json,.json', hidden: true });
  let importMode = 'merge';
  fileInput.addEventListener('change', async () => {
    const f = fileInput.files[0];
    fileInput.value = '';
    if (!f) return;
    try {
      let obj;
      try { obj = JSON.parse(await f.text()); } catch { toast(t('st.err.json'), { error: true }); return; }
      const inner = obj?.app === 'life-in-the-uk-practice' ? obj.state : obj;
      if (!Array.isArray(inner?.attempts)) { toast(t('st.err.notBackup'), { error: true }); return; }
      const n = inner.attempts.length;
      const replace = importMode === 'replace';
      const sure = await confirmDialog({
        title: replace ? t('st.replace.title') : t('st.merge.title'),
        body: replace ? t('st.replace.body', { now: store.getState().attempts.length, n }) : t('st.merge.body', { n }),
        confirm: replace ? t('st.replace.confirm') : t('st.merge.confirm'), danger: replace,
      });
      if (!sure) return;
      const res = store.importData(obj, importMode);
      toast(res.message, { error: !res.ok, ms: 6000 });
    } catch (err) {
      console.error(err);
      toast(t('st.err.import'), { error: true });
    }
    redraw();
  });

  const canShare = (() => { try { return !!navigator.canShare?.({ files: [backupFile().file] }); } catch { return false; } })();
  const doExport = () => {
    const { text, name } = backupFile();
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = h('a', { href: url, download: name });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    store.markExported();
    // A browser can't tell us the file really landed, so say where to look rather than claim success.
    toast(t('st.exported', { name }), { ms: 7000 });
    redraw();
  };
  const doShare = async () => {
    try {
      await navigator.share({ files: [backupFile().file], title: t('st.shareTitle') });
      store.markExported();
      redraw();
    } catch (err) { if (err.name !== 'AbortError') toast(t('st.shareFailed'), { error: true }); }
  };

  const shareBtn = canShare ? h('button', { class: isIOS ? 'btn btn-primary' : 'btn', onClick: doShare }, icon('upload', 18), t('st.share')) : null;
  const downloadBtn = h('button', { class: isIOS && canShare ? 'btn' : 'btn btn-primary', onClick: doExport }, icon('download', 18), t('st.download'));

  // ----- previous copies (taken automatically before erase / replace / restore) -----
  const prev = store.listPrev();
  const prevSection = prev.length
    ? h('div', { class: 'prev' },
        h('h4', null, t('st.prev.title')),
        h('p', { class: 'setting-hint' }, t('st.prev.hint')),
        prev.map((p) => h('div', { class: 'setting' },
          h('div', { class: 'setting-main' },
            h('div', { class: 'setting-label' }, t('st.prev.line', { answers: p.answers, sessions: p.sessions })),
            h('div', { class: 'setting-hint' }, `${fmtWhen(p.at)} · ${REASON_KEY[p.reason] ? t(REASON_KEY[p.reason]) : p.reason}`)),
          h('button', {
            class: 'btn btn-sm',
            onClick: async () => {
              const sure = await confirmDialog({ title: t('st.restore.title'), body: t('st.restore.body', { n: store.getState().attempts.length }), confirm: t('st.restore.confirm') });
              if (!sure) return;
              const res = store.restorePrev(p.index);
              toast(res.message, { error: !res.ok, ms: 5000 });
              redraw();
            },
          }, t('st.restore.confirm')))))
    : null;

  const persistLine = h('p', { class: 'muted', id: 'persist' }, t('st.persist.checking'));
  store.storageStatus().then((st) => {
    persistLine.replaceChildren(
      !st.supported ? t('st.persist.unsupported') : st.persisted ? t('st.persist.protected') : t('st.persist.notProtected'));
    if (st.supported && !st.persisted) {
      persistLine.append(' ', h('button', { class: 'btn btn-sm', onClick: async () => {
        const ok = await store.requestPersistence();
        toast(ok ? t('st.persist.done') : t('st.persist.declined'), { error: !ok, ms: 5000 });
        redraw();
      } }, t('st.persist.protect')));
    }
  });

  const reset = async () => {
    const sure = await confirmDialog({
      title: t('st.reset.title'), danger: true, confirm: t('st.reset.confirm'), requireText: t('st.reset.word'),
      body: t('st.reset.body', { answers: state.attempts.length, sessions: state.sessions.length }),
    });
    if (!sure) return;
    const res = store.resetAll();
    toast(res.message, { error: !res.ok, ms: 6000 });
    redraw();
  };

  root.replaceChildren(h('div', { class: 'stack-v' },
    h('section', { class: 'card' },
      h('h3', null, t('st.language')),
      h('p', { class: 'muted' }, t('st.languageHint')),
      langPicker({ withAuto: true })),
    h('section', { class: 'card' },
      h('h3', null, t('st.study')),
      row(t('st.testDate'), left == null ? t('st.testDateHint.none') : tn('st.testDateHint.days', left), dateInput),
      row(t('st.dailyGoal'), t('st.dailyGoalHint'), goal)),
    h('section', { class: 'card' },
      h('h3', null, t('st.practice')),
      toggle('shuffleQuestions', t('st.shuffleQ'), t('st.shuffleQHint')),
      toggle('shuffleOptions', t('st.shuffleO'), t('st.shuffleOHint')),
      row(t('st.theme'), null, theme)),
    h('section', { class: 'card' },
      h('h3', null, t('st.backup.title')),
      h('p', { class: 'muted' }, t('st.backup.last', { when: timeAgo(state.lastExportAt), changes: state.unsaved ? tn('st.backup.changes', state.unsaved) : '' })),
      h('div', { class: 'btn-row' }, isIOS ? [shareBtn, downloadBtn] : [downloadBtn, shareBtn]),
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn', onClick: () => { importMode = 'merge'; fileInput.click(); } }, icon('upload', 18), t('st.importMerge')),
        h('button', { class: 'btn', onClick: () => { importMode = 'replace'; fileInput.click(); } }, t('st.importReplace'))),
      h('p', { class: 'setting-hint' }, t('st.mergeHint')),
      fileInput,
      persistLine,
      isIOS && !isStandalone
        ? h('div', { class: 'banner banner-info', style: 'margin-top:12px' }, icon('shield', 18), t('st.iosBanner'))
        : null,
      prevSection),
    h('section', { class: 'card about' },
      h('h3', null, t('st.about.title')),
      h('p', null, t('st.about.intro')),
      h('p', { class: 'about-facts' }, t('st.about.facts', { q: bank.questions.length, e: bank.meta.exams.length })),
      ['accurate', 'mistake', 'private', 'unofficial'].map((k) => h('p', { class: 'about-point' }, h('strong', null, t(`st.about.${k}.title`) + ' '), t(`st.about.${k}.body`))),
      h('p', { class: 'muted' }, t('st.about.free')),
      h('div', { class: 'btn-row' }, coffeeButton(),
        h('a', { class: 'btn', href: SOURCE_URL, target: '_blank', rel: 'noopener noreferrer' }, icon('list', 18), t('st.about.source'))),
      credits()),
    h('section', { class: 'card' },
      h('h3', null, t('st.erase')),
      h('button', { class: 'btn btn-danger btn-sm', onClick: reset }, t('st.erase')))));
  return () => {};
}
