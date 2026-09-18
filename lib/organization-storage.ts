import { parseOrganization, type Organization } from './organization';
export const organizationKey = 'quote-builder-organization-v1';
export function loadOrganization(storage: Pick<Storage, 'getItem'>) {
  try {
    const raw = storage.getItem(organizationKey);
    return {
      organization: raw === null ? { archivedIds: [] } : parseOrganization(raw),
      raw,
      readable: true,
    };
  } catch {
    return {
      organization: { archivedIds: [] } as Organization,
      raw: null,
      readable: false,
    };
  }
}
export function saveOrganization(
  storage: Pick<Storage, 'getItem' | 'setItem'>,
  organization: Organization,
  expected: string | null,
): string {
  const raw = JSON.stringify({ version: 1, ...organization });
  parseOrganization(raw);
  if (storage.getItem(organizationKey) !== expected)
    throw new Error(
      'Draft organization changed in another tab. Reload before saving.',
    );
  storage.setItem(organizationKey, raw);
  return raw;
}
