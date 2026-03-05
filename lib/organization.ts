import { type Draft } from './drafts';
export type Organization = { archivedIds: string[] };
export function validOrganization(value: unknown): value is Organization {
  if (!value || typeof value !== 'object') return false;
  const ids = (value as Organization).archivedIds;
  return Array.isArray(ids) && ids.length <= 20 && ids.every(id => typeof id === 'string' && id.length > 0 && id.length <= 100) && new Set(ids).size === ids.length;
}

export function parseOrganization(raw: string): Organization {
  const value = JSON.parse(raw);
  if (!value || value.version !== 1 || !validOrganization(value)) throw new Error('Invalid draft organization data');
  return { archivedIds: [...value.archivedIds] };
}

export function setArchived(organization: Organization, id: string, archived: boolean): Organization {
  const archivedIds = organization.archivedIds.filter(value => value !== id);
  if (archived) archivedIds.push(id);
  const next = { archivedIds };
  if (!validOrganization(next)) throw new Error('Keep at most 20 archived draft references.');
  return next;
}

export function visibleDrafts(drafts: Draft[], organization: Organization, scope: string): Draft[] {
  return drafts.filter(draft => scope === 'all' || organization.archivedIds.includes(draft.id) === (scope === 'archived'));
}
