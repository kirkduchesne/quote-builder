'use client';
import { useEffect, useState } from 'react';
import { QuoteForm } from '@/components/quote-form';
import { Button } from '@/components/ui/button';
import { newDraft, parseDrafts, validDraft, type Draft } from '@/lib/drafts';
const storageKey = 'quote-builder-drafts-v1';
export function DraftWorkspace() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [active, setActive] = useState<Draft | null>(null);
  const [dirty, setDirty] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const saved = raw === null ? [] : parseDrafts(raw);
      setDrafts(saved); setActive(saved[0] || newDraft('first'));
    } catch {
      setBlocked(true); setActive(newDraft('session'));
      setMessage('Saved drafts could not be read. Session-only changes will leave the saved data untouched.');
    }
  }, []);
  function save(draft: Draft) {
    if (!validDraft(draft)) { setMessage('The draft has invalid values. Check the fields before saving.'); return; }
    const saved = drafts.some(d => d.id === draft.id) ? drafts.map(d => d.id === draft.id ? draft : d) : [...drafts, draft];
    if (saved.length > 20) { setMessage('Keep at most 20 drafts. Delete a saved draft first.'); return; }
    setDrafts(saved); setActive(draft); setDirty(false);
    if (blocked) { setMessage('Draft kept for this session only. Unreadable saved data was not changed.'); return; }
    try { localStorage.setItem(storageKey, JSON.stringify({ version: 1, drafts: saved })); setMessage('Draft saved in this browser.'); }
    catch { setMessage('Storage is unavailable or full. Draft kept for this session only.'); }
  }
  if (!active) return <p role="status">Loading saved drafts…</p>;
  return <><p role="status" className="mb-4 print:hidden">{message}</p><QuoteForm key={active.id} initial={active} onSave={save} onDirty={setDirty} /></>;
}
