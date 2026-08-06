export function makeHardwareSlugBase(model: string): string {
  const normalized = model
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80)
    .replace(/-$/, '');

  if (normalized) return normalized;

  if (model.includes('شبکه')) return 'network-accessory-4-port';
  if (model.includes('قلم')) return 'hp-elite-stylus';

  return 'hardware-item';
}

export function makeUniqueHardwareSlug(
  model: string,
  index: number,
  slugCounts: Record<string, number>
): string {
  let base = makeHardwareSlugBase(model);

  if (base === 'hardware-item') {
    base = `hardware-item-${String(index + 1).padStart(3, '0')}`;
  }

  if (!slugCounts[base]) slugCounts[base] = 0;
  slugCounts[base]++;

  return slugCounts[base] === 1 ? base : `${base}-${slugCounts[base]}`;
}
