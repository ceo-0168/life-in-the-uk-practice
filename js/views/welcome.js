// First-visit screen. Shown only to someone with no history who hasn't dismissed it (see shouldShowWelcome).
import { MOCK, daysToTest, selectQuestions } from '../engine.js';
import * as store from '../store.js';
import { bank, cards } from '../ctx.js';
import { startSession } from '../session.js';
import { h, icon } from '../ui.js';
import { t, tn } from '../i18n.js';
import { langPicker } from './lang.js';

const ua = navigator.userAgent;
const isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = /android/i.test(ua);
const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;

function installTip() {
  if (isStandalone) return null;
  return t(isIOS ? 'welcome.install.ios' : isAndroid ? 'welcome.install.android' : 'welcome.install.desktop');
}

export function renderWelcome(root, { redraw }) {
  const state = store.getState();
  const total = bank.questions.length;

  const dismiss = () => { store.setSettings({ welcomed: true }); redraw(); };
  const startFirst = () => {
    store.setSettings({ welcomed: true });
    const qids = selectQuestions('new', { questions: bank.questions, cards: cards(), limit: 10 });
    startSession({ mode: 'practice', kind: 'new', label: 'First steps', qids });
  };

  const dateNote = h('p', { class: 'setting-hint', id: 'date-note' });
  const showDateNote = (v) => {
    const left = daysToTest(v);
    dateNote.textContent = left == null ? t('welcome.date.optional') : left === 0 ? t('welcome.date.today') : tn('welcome.date.daysToGo', left);
  };
  const dateInput = h('input', {
    class: 'input', type: 'date', id: 'test-date', value: state.settings.testDate || '', 'aria-label': t('welcome.when'),
    onChange: (e) => { store.setSettings({ testDate: e.target.value }); showDateNote(e.target.value); },
  });
  showDateNote(state.settings.testDate);

  const step = (n, title, text) => h('li', { class: 'wstep' },
    h('span', { class: 'wstep-n', 'aria-hidden': 'true' }, String(n)),
    h('div', null, h('h3', null, title), h('p', { class: 'muted' }, text)));
  const fact = (big, small) => h('div', { class: 'wfact' }, h('div', { class: 'wfact-n' }, big), h('div', { class: 'wfact-l' }, small));
  const tip = installTip();

  root.replaceChildren(h('div', { class: 'stack-v welcome' },
    h('div', { class: 'wlang' }, langPicker()),

    h('section', { class: 'whero' },
      h('div', { class: 'eyebrow' }, t('welcome.eyebrow')),
      h('h1', null, t('welcome.title')),
      h('p', null, t('welcome.intro', { n: total })),
      h('button', { class: 'btn btn-light btn-lg btn-block', onClick: startFirst }, icon('play', 18), t('welcome.start')),
      h('p', { class: 'whero-links' },
        h('button', { class: 'linkbtn', onClick: dismiss }, t('welcome.dashboard')),
        h('span', { 'aria-hidden': 'true' }, ' · '),
        h('a', { class: 'linkbtn', href: '#/settings' }, t('welcome.restore')))),

    h('section', { class: 'card' },
      h('h2', { class: 'wh2' }, t('welcome.how')),
      h('ol', { class: 'wsteps' },
        step(1, t('welcome.step1.title'), t('welcome.step1.body')),
        step(2, t('welcome.step2.title'), t('welcome.step2.body')),
        step(3, t('welcome.step3.title'), t('welcome.step3.body')))),

    h('section', { class: 'card' },
      h('h2', { class: 'wh2' }, t('welcome.realTest')),
      h('div', { class: 'wfacts' },
        fact(String(MOCK.questions), t('welcome.fact.questions')),
        fact(String(MOCK.minutes), t('welcome.fact.minutes')),
        fact(`${MOCK.passMark}/${MOCK.questions}`, t('welcome.fact.toPass'))),
      h('p', { class: 'muted' }, t('welcome.testDesc'))),

    h('section', { class: 'card' },
      h('h2', { class: 'wh2' }, t('welcome.when')),
      dateInput, dateNote),

    h('section', { class: 'card wnotes' },
      h('p', null, icon('shield', 18), h('span', null, h('strong', null, t('welcome.private.title') + ' '), t('welcome.private.body'))),
      tip ? h('p', null, icon('download', 18), h('span', null, h('strong', null, t('welcome.install.title') + ' '), tip)) : null,
      h('p', null, icon('alert', 18), h('span', null, h('strong', null, t('welcome.unofficial.title') + ' '), t('welcome.unofficial.body'))),
      h('p', null, icon('list', 18), h('span', null, h('strong', null, t('welcome.english.title') + ' '), t('welcome.english.body')))),

    h('button', { class: 'btn btn-primary btn-lg btn-block', onClick: startFirst }, icon('play', 18), t('welcome.start'))));
  return () => {};
}
