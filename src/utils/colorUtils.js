// Shared color helpers
export function getCorClass(cor) {
  if (!cor) return '';
  const k = String(cor).trim().toLowerCase();
  const known = ['vermelho','amarelo','verde','azul','laranja'];
  if (known.includes(k)) return k;
  return k.replace(/[^a-z0-9]+/g, '-');
}

export default { getCorClass };

export function getPrioridadeClass(prioridade) {
  if (!prioridade) return '';
  const s = String(prioridade).normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  if (s.includes('alta') || s.includes('crit')) return 'prioridade-alta';
  if (s.includes('media') || s.includes('média') || s.includes('med')) return 'prioridade-media';
  if (s.includes('baixa')) return 'prioridade-baixa';
  return 'prioridade-media';
}
