// Tiny DOM helpers. Text is always inserted as text nodes, never as HTML.

const DIRECT = new Set(['value', 'checked', 'disabled', 'hidden', 'selected', 'open', 'tabIndex', 'textContent']);

export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (DIRECT.has(k)) el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  append(el, kids);
  return el;
}

export function append(el, kids) {
  for (const k of kids.flat(Infinity)) {
    if (k == null || k === false) continue;
    el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
  return el;
}

const PATHS = {
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  flag: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7',
  check: 'M20 6L9 17l-5-5',
  x: 'M18 6L6 18M6 6l12 12',
  home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  chart: 'M18 20V10M12 20V4M6 20v-6',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  sliders: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2',
  flame: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  right: 'M9 18l6-6-6-6',
  left: 'M15 18l-6-6 6-6',
  pencil: 'M12 20h9 M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.35-4.35',
  refresh: 'M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
  alert: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01',
  play: 'M5 3l14 9-14 9V3z',
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
};

export function icon(name, size = 20) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'icon');
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', PATHS[name] || '');
  svg.append(path);
  return svg;
}

export function svgEl(tag, attrs = {}, ...kids) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  for (const k of kids) if (k != null) el.append(k instanceof Node ? k : document.createTextNode(k));
  return el;
}

export function toast(message, { error = false, ms = 3500 } = {}) {
  const root = document.getElementById('toasts');
  const el = h('div', { class: 'toast' + (error ? ' toast-error' : ''), role: error ? 'alert' : 'status' }, message);
  root.append(el);
  setTimeout(() => el.remove(), ms);
}

/** Open a <dialog> modally; very old browsers without showModal get a plain non-modal open dialog. */
export function openDialog(dlg) {
  if (typeof dlg.showModal === 'function') dlg.showModal();
  else dlg.setAttribute('open', '');
}

/** Close every open dialog (resolves any pending confirmDialog as "cancelled"). */
export function closeDialogs() {
  document.querySelectorAll('dialog[open]').forEach((d) => {
    try { d.close('cancel'); } catch { d.removeAttribute('open'); }
  });
}

/** Speak a short message to screen readers through the page's persistent live region. */
export function announce(message) {
  const el = document.getElementById('live');
  if (!el) return;
  el.textContent = '';
  setTimeout(() => { el.textContent = message; }, 60);
}

/** Promise-based confirm dialog. */
export function confirmDialog({ title, body, confirm = 'Confirm', cancel = 'Cancel', danger = false, requireText = null }) {
  if (typeof HTMLDialogElement === 'undefined' || typeof HTMLDialogElement.prototype.showModal !== 'function') {
    return Promise.resolve(window.confirm(`${title}\n\n${body}`));
  }
  return new Promise((resolve) => {
    let input = null;
    const ok = h('button', { class: 'btn ' + (danger ? 'btn-danger' : 'btn-primary'), type: 'submit', value: 'ok', disabled: !!requireText }, confirm);
    if (requireText) {
      input = h('input', {
        class: 'input', type: 'text', placeholder: `Type ${requireText} to confirm`, autocomplete: 'off',
        onInput: () => { ok.disabled = input.value.trim().toLowerCase() !== requireText.toLowerCase(); },
      });
    }
    const dlg = h('dialog', { class: 'dialog' },
      h('form', { method: 'dialog' },
        h('h2', null, title),
        h('p', null, body),
        input,
        h('div', { class: 'dialog-actions' },
          h('button', { class: 'btn', type: 'button', onClick: () => dlg.close('cancel') }, cancel),
          ok)));
    dlg.addEventListener('close', () => { resolve(dlg.returnValue === 'ok'); dlg.remove(); });
    document.body.append(dlg);
    openDialog(dlg);
  });
}

export const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);

export function fmtDuration(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function timeAgo(ts) {
  if (!ts) return 'never';
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

/** Stacked horizontal bar. segments: [{n, cls, label}] */
export function stackedBar(segments, total) {
  return h('div', { class: 'stack', role: 'img', 'aria-label': segments.map((s) => `${s.label}: ${s.n}`).join(', ') },
    segments.filter((s) => s.n > 0).map((s) => h('span', { class: `stack-seg ${s.cls}`, style: `width:${(s.n / total) * 100}%` })));
}
