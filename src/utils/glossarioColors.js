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
    lines.push(`.cor-indicator.${token} { background-color: ${hex}; }`);
    // card accent
    lines.push(`.luz-card.${token} { border-left-color: ${hex}; }`);
  });

  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.appendChild(document.createTextNode(lines.join('\n')));
  document.head.appendChild(el);
}

export default ensureGlossarioColors;
