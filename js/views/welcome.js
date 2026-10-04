// First-visit screen. Shown only to someone with no history who hasn't dismissed it (see shouldShowWelcome).
import { MOCK, daysToTest, selectQuestions } from '../engine.js';
import * as store from '../store.js';
import { bank, cards } from '../ctx.js';
import { startSession } from '../session.js';
import { h, icon } from '../ui.js';

const ua = navigator.userAgent;
const isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = /android/i.test(ua);
const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;

function installTip() {
  if (isStandalone) return null;
  if (isIOS) return 'To keep it like an app, tap Share → Add to Home Screen. Do this before you start, because the installed app keeps its own progress.';
  if (isAndroid) return 'To keep it like an app, open your browser menu and choose Install app.';
  return 'To keep it like an app, use the install icon in your browser\'s address bar (Chrome, Edge) or File → Add to Dock (Safari).';
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
    dateNote.textContent = left == null ? 'Optional. With a date, reviews are scheduled so you see every question again before the day.'
      : left === 0 ? 'Your test is today. Good luck!'
      : `${left} day${left === 1 ? '' : 's'} to go. Reviews will be scheduled to fit.`;
  };
  const dateInput = h('input', {
    class: 'input', type: 'date', id: 'test-date', value: state.settings.testDate || '',
    onChange: (e) => { store.setSettings({ testDate: e.target.value }); showDateNote(e.target.value); },
  });
  showDateNote(state.settings.testDate);

  const step = (n, title, text) => h('li', { class: 'wstep' },
    h('span', { class: 'wstep-n', 'aria-hidden': 'true' }, String(n)),
    h('div', null, h('h3', null, title), h('p', { class: 'muted' }, text)));
  const fact = (big, small) => h('div', { class: 'wfact' }, h('div', { class: 'wfact-n' }, big), h('div', { class: 'wfact-l' }, small));
  const tip = installTip();

  root.replaceChildren(h('div', { class: 'stack-v welcome' },
    h('section', { class: 'whero' },
      h('div', { class: 'eyebrow' }, 'Free practice for the Life in the UK test'),
      h('h1', null, 'Practise smarter, not longer'),
      h('p', null, `${total} questions from 18 mock exams, each with an explanation from the handbook. The app remembers every answer and brings back the ones you get wrong, at the right time.`),
      h('button', { class: 'btn btn-light btn-lg btn-block', onClick: startFirst }, icon('play', 18), 'Start with 10 questions'),
      h('p', { class: 'whero-links' },
        h('button', { class: 'linkbtn', onClick: dismiss }, 'Go to my dashboard'),
        h('span', { 'aria-hidden': 'true' }, ' · '),
        h('a', { class: 'linkbtn', href: '#/settings' }, 'Restore a backup'))),

    h('section', { class: 'card' },
      h('h2', { class: 'wh2' }, 'How it works'),
      h('ol', { class: 'wsteps' },
        step(1, 'Practise with feedback', 'Answer and see straight away whether you were right, with the reason from the handbook.'),
        step(2, 'Review at the right time', 'Wrong answers come back immediately. Right ones return after a few days, until you know them.'),
        step(3, 'Test yourself', 'Take a timed mock test, like the real one, when you feel ready.'))),

    h('section', { class: 'card' },
      h('h2', { class: 'wh2' }, 'The real test'),
      h('div', { class: 'wfacts' },
        fact(String(MOCK.questions), 'questions'),
        fact(String(MOCK.minutes), 'minutes'),
        fact(`${MOCK.passMark}/${MOCK.questions}`, 'to pass (75%)')),
      h('p', { class: 'muted' }, 'Multiple choice, on a computer. Some questions ask you to choose two answers. Booked through GOV.UK.')),

    h('section', { class: 'card' },
      h('h2', { class: 'wh2' }, 'When is your test?'),
      dateInput, dateNote),

    h('section', { class: 'card wnotes' },
      h('p', null, icon('shield', 18), h('span', null, h('strong', null, 'Private. '), 'No account needed. Your progress stays in this browser and is never sent anywhere.')),
      tip ? h('p', null, icon('download', 18), h('span', null, h('strong', null, 'Install. '), tip)) : null,
      h('p', null, icon('alert', 18), h('span', null, h('strong', null, 'Unofficial. '), 'Not affiliated with the Home Office. The questions come from a community bank and have been checked against the handbook.'))),

    h('button', { class: 'btn btn-primary btn-lg btn-block', onClick: startFirst }, icon('play', 18), 'Start with 10 questions')));
  return () => {};
}
