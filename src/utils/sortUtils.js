// Small helpers to keep dropdown items consistently sorted (pt-BR, case/accent-insensitive).

export const ptBrCollator = new Intl.Collator('pt-BR', {
  sensitivity: 'base',
  numeric: true,
});

export function comparePtBr(a, b) {
  return ptBrCollator.compare(String(a ?? ''), String(b ?? ''));
}

export function sortByLabelPtBr(items, getLabel) {
  if (!Array.isArray(items)) return [];
  const labelOf = typeof getLabel === 'function' ? getLabel : (x) => x;
  return [...items].sort((a, b) => comparePtBr(labelOf(a), labelOf(b)));
}

// Keeps "empty" options (value === '' | null | undefined) at the top in their original order,
// and sorts the remaining options by label.
export function sortDropdownOptionsPtBr(options) {
  if (!Array.isArray(options)) return [];

  const head = [];
  const rest = [];

  for (const opt of options) {
    const value = opt?.value;
    if (value === '' || value === null || value === undefined) {
      head.push(opt);
    } else {
      rest.push(opt);
    }
  }

  rest.sort((a, b) => comparePtBr(a?.label, b?.label));
  return [...head, ...rest];
}
