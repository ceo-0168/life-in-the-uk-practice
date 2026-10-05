// Language choice. Saved as a setting ('auto' follows the browser) and applied by re-drawing the whole shell.
import * as store from '../store.js';
import { LANGS, getLang, resolveLang, setLang, t } from '../i18n.js';
import { h } from '../ui.js';

export function selectLang(code) {
  store.setSettings({ lang: code });
  setLang(resolveLang(code));
  document.dispatchEvent(new Event('langchange')); // main.js rebuilds the navigation and the current page
}

/** A segmented control. Names are always shown in their own language so anyone can find theirs. */
export function langPicker({ withAuto = false } = {}) {
  const saved = store.getState().settings.lang;
  const options = [...(withAuto ? [{ code: 'auto', label: t('lang.auto') }] : []), ...LANGS];
  return h('div', { class: 'seg lang-seg', role: 'group', 'aria-label': 'Language / 語言 / 语言' },
    options.map((o) => {
      const on = withAuto ? saved === o.code : getLang() === o.code;
      return h('button', {
        class: 'seg-btn' + (on ? ' on' : ''), type: 'button', 'aria-pressed': on ? 'true' : 'false',
        lang: o.code === 'auto' ? undefined : o.code, onClick: () => selectLang(o.code),
      }, o.label);
    }));
}
