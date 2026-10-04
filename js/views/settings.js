import * as store from '../store.js';
import { daysToTest, SETTING_CHOICES } from '../engine.js';
import { h, icon, toast, confirmDialog, timeAgo } from '../ui.js';
import { coffeeButton } from './support.js';

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;

function backupFile() {
  const text = JSON.stringify(store.exportData(), null, 1);
  const name = `life-in-uk-progress-${new Date().toISOString().slice(0, 10)}.json`;
  return { text, name, file: new File([text], name, { type: 'application/json' }) };
}

const fmtWhen = (ts) => new Date(ts).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

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

  const dateInput = h('input', { class: 'input', type: 'date', value: s.testDate || '', 'aria-label': 'Test date', onChange: (e) => { store.setSettings({ testDate: e.target.value }); redraw(); } });
  const left = daysToTest(s.testDate);

  const goal = h('select', { class: 'input', 'aria-label': 'Daily goal', onChange: (e) => store.setSettings({ dailyGoal: Number(e.target.value) }) },
    SETTING_CHOICES.dailyGoal.map((n) => h('option', { value: String(n), selected: n === s.dailyGoal }, `${n} questions`)));

  const theme = h('div', { class: 'seg', role: 'group', 'aria-label': 'Theme' },
    [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']].map(([k, label]) => h('button', {
      class: 'seg-btn' + (s.theme === k ? ' on' : ''), type: 'button', 'aria-pressed': s.theme === k ? 'true' : 'false',
      onClick: () => { store.setSettings({ theme: k }); applyTheme(); redraw(); },
    }, label)));

  // ----- backup -----
  const fileInput = h('input', { type: 'file', accept: 'application/json,.json', hidden: true });
  let importMode = 'merge';
  fileInput.addEventListener('change', async () => {
    const f = fileInput.files[0];
    fileInput.value = '';
    if (!f) return;
    try {
      let obj;
      try { obj = JSON.parse(await f.text()); } catch { toast('That file is not valid JSON.', { error: true }); return; }
      const inner = obj?.app === 'life-in-the-uk-practice' ? obj.state : obj;
      if (!Array.isArray(inner?.attempts)) { toast('That file is not a progress backup.', { error: true }); return; }
      const n = inner.attempts.length;
      const replace = importMode === 'replace';
      const sure = await confirmDialog({
        title: replace ? 'Replace all progress?' : 'Merge this backup?',
        body: replace
          ? `This replaces the ${store.getState().attempts.length} answers on this device with the ${n} in the file. Your current progress is kept under "Previous copies" so you can undo this. Merge is usually what you want.`
          : `The file has ${n} answers. Anything new is added; nothing on this device is removed.`,
        confirm: replace ? 'Replace' : 'Merge', danger: replace,
      });
      if (!sure) return;
      const res = store.importData(obj, importMode);
      toast(res.message, { error: !res.ok, ms: 6000 });
    } catch (err) {
      console.error(err);
      toast('That file could not be imported. Nothing was changed.', { error: true });
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
    toast(`Backup file "${name}" created. Check your Downloads folder (or the Files app) to be sure it saved.`, { ms: 7000 });
    redraw();
  };
  const doShare = async () => {
    try {
      await navigator.share({ files: [backupFile().file], title: 'Life in the UK progress' });
      store.markExported();
      redraw();
    } catch (err) { if (err.name !== 'AbortError') toast('Sharing failed. Use Download instead.', { error: true }); }
  };

  const shareBtn = canShare ? h('button', { class: isIOS ? 'btn btn-primary' : 'btn', onClick: doShare }, icon('upload', 18), 'Share / save to Files') : null;
  const downloadBtn = h('button', { class: isIOS && canShare ? 'btn' : 'btn btn-primary', onClick: doExport }, icon('download', 18), 'Download backup');

  // ----- previous copies (taken automatically before erase / replace / restore) -----
  const prev = store.listPrev();
  const prevSection = prev.length
    ? h('div', { class: 'prev' },
        h('h4', null, 'Previous copies'),
        h('p', { class: 'setting-hint' }, 'Saved automatically just before an erase, replace or restore, so those can be undone.'),
        prev.map((p) => h('div', { class: 'setting' },
          h('div', { class: 'setting-main' },
            h('div', { class: 'setting-label' }, `${p.answers} answers · ${p.sessions} sessions`),
            h('div', { class: 'setting-hint' }, `${fmtWhen(p.at)} · ${p.reason}`)),
          h('button', {
            class: 'btn btn-sm',
            onClick: async () => {
              const sure = await confirmDialog({ title: 'Restore this copy?', body: `Your current progress (${store.getState().attempts.length} answers) is saved as a previous copy first, so you can switch back.`, confirm: 'Restore' });
              if (!sure) return;
              const res = store.restorePrev(p.index);
              toast(res.message, { error: !res.ok, ms: 5000 });
              redraw();
            },
          }, 'Restore'))))
    : null;

  const persistLine = h('p', { class: 'muted', id: 'persist' }, 'Checking storage…');
  store.storageStatus().then((st) => {
    persistLine.replaceChildren(
      !st.supported ? 'This browser cannot report storage protection. Keep regular backups.'
        : st.persisted ? 'Storage is protected: the browser will not clear your progress automatically.'
        : 'Storage is not yet protected. The browser may clear it if space runs low.');
    if (st.supported && !st.persisted) {
      persistLine.append(' ', h('button', { class: 'btn btn-sm', onClick: async () => {
        const ok = await store.requestPersistence();
        toast(ok ? 'Storage protected.' : 'Your browser declined. Install the app to your home screen, and keep backups.', { error: !ok, ms: 5000 });
        redraw();
      } }, 'Protect it'));
    }
  });

  const reset = async () => {
    const sure = await confirmDialog({
      title: 'Erase all progress?', danger: true, confirm: 'Erase everything', requireText: 'erase',
      body: `This deletes ${state.attempts.length} answers, ${state.sessions.length} sessions, and all notes and saved questions on this device. A copy is kept under "Previous copies" so you can undo it, but download a backup if you are unsure.`,
    });
    if (!sure) return;
    const res = store.resetAll();
    toast(res.message, { error: !res.ok, ms: 6000 });
    redraw();
  };

  root.replaceChildren(h('div', { class: 'stack-v' },
    h('section', { class: 'card' },
      h('h3', null, 'Study plan'),
      row('Test date', left == null ? 'Add it and reviews are scheduled to land before the day.' : `${left} day${left === 1 ? '' : 's'} to go — review intervals are shortened to fit.`, dateInput),
      row('Daily goal', 'Answers per day, shown on Home. Answering anything on a day keeps your streak.', goal)),
    h('section', { class: 'card' },
      h('h3', null, 'Practice'),
      toggle('shuffleQuestions', 'Shuffle question order', 'Mock tests are always shuffled.'),
      toggle('shuffleOptions', 'Shuffle answer options', 'True/False and Yes/No stay in a fixed order.'),
      row('Theme', null, theme)),
    h('section', { class: 'card' },
      h('h3', null, 'Back up & move progress'),
      h('p', { class: 'muted' }, `Last backup: ${timeAgo(state.lastExportAt)}${state.unsaved ? ` · ${state.unsaved} change${state.unsaved === 1 ? '' : 's'} since` : ''}. Progress is kept in this browser; a backup file protects it and moves it between phone and laptop.`),
      h('div', { class: 'btn-row' }, isIOS ? [shareBtn, downloadBtn] : [downloadBtn, shareBtn]),
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn', onClick: () => { importMode = 'merge'; fileInput.click(); } }, icon('upload', 18), 'Import & merge'),
        h('button', { class: 'btn', onClick: () => { importMode = 'replace'; fileInput.click(); } }, 'Import & replace')),
      h('p', { class: 'setting-hint' }, 'Merge combines two devices: export on one, merge on the other, then repeat the other way round.'),
      fileInput,
      persistLine,
      isIOS && !isStandalone
        ? h('div', { class: 'banner banner-info', style: 'margin-top:12px' }, icon('shield', 18), 'On iPhone, tap Share → Add to Home Screen. Installed apps keep their data (Safari tabs can lose it after 7 days of no use), but the installed app starts empty, so import a backup into it once.')
        : null,
      prevSection),
    h('section', { class: 'card' },
      h('h3', null, 'About'),
      h('p', { class: 'muted' }, 'Questions come from the unofficial public question bank at github.com/DHKLeung/life-in-the-uk-test (18 mock exams). They are not Home Office questions. Answers and explanations have been checked against the Life in the UK handbook (3rd edition, with later updates); where the handbook and current law differ, the handbook answer is marked and a note says what changed. Use "Looks wrong?" to flag any answer you doubt.'),
      h('p', { class: 'muted' }, 'Free and ad-free, made by one person. If it helped, you can buy me a coffee.'),
      h('div', { class: 'btn-row' }, coffeeButton()),
      h('button', { class: 'btn btn-danger btn-sm', onClick: reset }, 'Erase all progress'))));
  return () => {};
}
