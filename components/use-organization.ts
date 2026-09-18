'use client';
import { useEffect, useRef, useState } from 'react';
import { setArchived, type Organization } from '@/lib/organization';
import { loadOrganization, saveOrganization } from '@/lib/organization-storage';

export function useOrganization() {
  const [organization, setOrganization] = useState<Organization>({
    archivedIds: [],
  });
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const raw = useRef<string | null>(null);
  const readable = useRef(false);
  useEffect(() => {
    const loaded = loadOrganization({
      getItem: (key) => localStorage.getItem(key),
    });
    setOrganization(loaded.organization);
    raw.current = loaded.raw;
    readable.current = loaded.readable;
    if (!loaded.readable)
      setMessage(
        'Draft organization could not be read. Saved metadata will be preserved; changes are session-only.',
      );
    setReady(true);
  }, []);
  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (pending) {
        event.preventDefault();
        event.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [pending]);
  function persist(next: Organization) {
    setOrganization(next);
    try {
      if (!readable.current) throw new Error('Unreadable metadata');
      raw.current = saveOrganization(localStorage, next, raw.current);
      setPending(false);
      setMessage('Draft organization saved.');
    } catch {
      setPending(true);
      setMessage(
        'Organization changes are session-only. Existing saved metadata was preserved. Quote contents are unchanged.',
      );
    }
  }
  function archive(id: string, value: boolean) {
    if (!ready) return;
    try {
      persist(setArchived(organization, id, value));
    } catch (error) {
      setMessage((error as Error).message);
    }
  }
  return { organization, ready, pending, message, archive, persist };
}
