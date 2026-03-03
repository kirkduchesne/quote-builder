import { type Draft } from './drafts';
export type Organization = { archivedIds: string[] };
export function validOrganization(value: unknown): value is Organization {
  if (!value || typeof value !== 'object') return false;
  const ids = (value as Organization).archivedIds;
  return Array.isArray(ids) && ids.length <= 20 && ids.every(id => typeof id === 'string' && id.length > 0 && id.length <= 100) && new Set(ids).size === ids.length;
}
