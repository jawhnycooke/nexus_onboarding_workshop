/**
 * deck-tweaks.js — runtime tweaks panel for every <deck-stage> deck.
 *
 * Each template sets window.__DECK_TWEAK_DEFAULTS as a plain object
 * literal, wrapped in the EDITMODE markers so the host's edit-mode
 * write-back round-trips changes back to disk:
 *
 *   <script>
 *     window.__DECK_TWEAK_DEFAULTS = /*EDITMODE-BEGIN* /{
 *       "accent": "indigo", "scale": 0.95, "wireframe": true
 *     }/*EDITMODE-END* /;
 *   </script>
 *   <script src="../deck-tweaks.js"></script>
 *
 * A plain JS object (not JSON) lets the EDITMODE comment markers sit
 * as ordinary JS comments around the literal — no escaping needed.
 *
 * Behavior:
 *   - Applies accent / scale / wireframe as CSS custom properties on :root
 *   - Mirrors the tweak UI (#tweaks-panel) to reflect current state
 *   - Listens for __activate_edit_mode / __deactivate_edit_mode postMessages
 *   - Announces __edit_mode_available back to the parent on boot
 *   - Persists changes via __edit_mode_set_keys postMessage on save
 *
 * Expected DOM (chrome lives in deck-base.css; each template renders it):
 *   #tweaks-panel  - container
 *   #sw-accent     - accent swatches wrapper (.sw elements with data-accent)
 *   #sl-scale      - <input type="range"> for font scale
 *   #sv-scale      - <span> showing the scale as "1.00×"
 *   #sw-wire       - wireframe toggle .tw-switch
 */

(function () {
  const ACCENTS = {
    indigo:  { deep:'#2B2358', base:'#4D3F91', soft:'#9B87CC' },
    ink:     { deep:'#0A0A0A', base:'#1A1A1A', soft:'#5A5A66' },
    magenta: { deep:'#5C2050', base:'#A04080', soft:'#B775A1' },
    teal:    { deep:'#0E3F3A', base:'#2A7F77', soft:'#79B5AE' },
  };

  const DEFAULT_DEFAULTS = { accent: 'indigo', scale: 1.00, wireframe: false };

  function readDefaults() {
    const provided = window.__DECK_TWEAK_DEFAULTS;
    if (provided && typeof provided === 'object') {
      return { ...DEFAULT_DEFAULTS, ...provided };
    }
    return { ...DEFAULT_DEFAULTS };
  }

  const state = readDefaults();
  const root = document.documentElement;

  function apply() {
    const a = ACCENTS[state.accent] || ACCENTS.indigo;
    root.style.setProperty('--wk-accent', a.base);
    root.style.setProperty('--wk-accent-deep', a.deep);
    root.style.setProperty('--wk-accent-soft', a.soft);
    // Map accent onto the core violet tokens so every layout picks it up
    root.style.setProperty('--wk-v-ink', a.base);
    root.style.setProperty('--wk-v-deep', a.deep);
    root.style.setProperty('--wk-v', a.base);
    root.style.setProperty('--wk-v-soft', a.soft);
    root.style.setProperty('--wk-scale', String(state.scale));
    root.style.setProperty('--wk-wireframe', state.wireframe ? '1' : '0');

    // Update UI — these are optional; social/single-surface decks
    // may omit the panel entirely.
    document.querySelectorAll('#sw-accent .sw').forEach(el => {
      el.classList.toggle('active', el.dataset.accent === state.accent);
    });
    const wire = document.getElementById('sw-wire');
    if (wire) wire.classList.toggle('on', !!state.wireframe);
    const sl = document.getElementById('sl-scale');
    if (sl) sl.value = state.scale;
    const sv = document.getElementById('sv-scale');
    if (sv) sv.textContent = Number(state.scale).toFixed(2) + '×';

    // Toggle a body class so any slide can opt into wire overlay
    document.body.classList.toggle('wk-wireframe-on', !!state.wireframe);
    ensureGridOverlays();
  }

  // Inject a wire overlay into every section once — cheap, opt-in via CSS var
  function ensureGridOverlays() {
    document.querySelectorAll('deck-stage > section').forEach(sec => {
      if (sec.querySelector('.wk-grid-overlay')) return;
      const overlay = document.createElement('div');
      overlay.className = 'wk-grid-overlay';
      sec.insertBefore(overlay, sec.firstChild);
    });
  }

  function save(partial) {
    Object.assign(state, partial);
    apply();
    try {
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits: partial }, '*');
    } catch (e) {}
  }

  // -------- Edit-mode protocol (Tweaks toggle in toolbar) --------
  window.addEventListener('message', (ev) => {
    const d = ev.data || {};
    const panel = document.getElementById('tweaks-panel');
    if (!panel) return;
    if (d.type === '__activate_edit_mode') {
      panel.classList.add('open');
    } else if (d.type === '__deactivate_edit_mode') {
      panel.classList.remove('open');
    }
  });
  // Register listener FIRST, then announce
  try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (e) {}

  // -------- Wire up controls (all optional) --------
  function wire() {
    const accent = document.getElementById('sw-accent');
    if (accent) {
      accent.addEventListener('click', (e) => {
        const sw = e.target.closest('.sw');
        if (!sw) return;
        save({ accent: sw.dataset.accent });
      });
    }
    const scale = document.getElementById('sl-scale');
    if (scale) {
      scale.addEventListener('input', (e) => {
        save({ scale: parseFloat(e.target.value) });
      });
    }
    const wireToggle = document.getElementById('sw-wire');
    if (wireToggle) {
      wireToggle.addEventListener('click', () => {
        save({ wireframe: !state.wireframe });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { wire(); apply(); });
  } else {
    wire();
    apply();
  }
})();
