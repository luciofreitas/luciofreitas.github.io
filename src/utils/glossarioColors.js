// Generate stylesheet rules from the `glossarioColors` mapping exported by `glossarioData.js`.
import { glossarioColors } from '../data/glossarioData';

const STYLE_ID = 'glossario-colors-generated';

export function ensureGlossarioColors() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;

  const lines = [];
  Object.entries(glossarioColors).forEach(([token, hex]) => {
    // legend dot
    lines.push(`.cor-dot.${token} { background-color: ${hex} !important; }`);
    // small indicator inside card
    lines.push(`.cor-indicator.${token} { background-color: ${hex} !important; }`);
    // card accent
    lines.push(`.luz-card.${token} { border-left-color: ${hex} !important; }`);
    // icon tinting for SVGs using currentColor when inlined
    lines.push(`.cor-icon.${token} { color: ${hex} !important; }`);
  });

  const cssText = lines.join('\n');
  // generated stylesheet (colors mapping) is injected below

  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.appendChild(document.createTextNode(cssText));
  document.head.appendChild(el);
}

export default ensureGlossarioColors;
