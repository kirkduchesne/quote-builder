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
  const [pendingStorage, setPendingStorage] = useState(false);
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
  useEffect(() => {
    function warn(event: BeforeUnloadEvent) { if (dirty || pendingStorage) { event.preventDefault(); event.returnValue = ''; } }
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, pendingStorage]);
  useEffect(() => {
    function changed(event: StorageEvent) {
      if (event.key === storageKey || event.key === null) {
        setBlocked(true); setMessage('Saved drafts changed in another tab. Reload before saving; session changes will not overwrite them.');
      }
    }
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, []);
  function canLeave() { return !dirty || window.confirm('Discard unsaved changes to this quote?'); }
  function save(draft: Draft) {
    if (!validDraft(draft)) { setMessage('The draft has invalid values. Check the fields before saving.'); return; }
    const saved = drafts.some(d => d.id === draft.id) ? drafts.map(d => d.id === draft.id ? draft : d) : [...drafts, draft];
    if (saved.length > 20) { setMessage('Keep at most 20 drafts. Delete a saved draft first.'); return; }
    setDrafts(saved); setActive(draft); setDirty(false);
    if (blocked) { setPendingStorage(true); setMessage('Draft kept for this session only. Unreadable saved data was not changed.'); return; }
    try { localStorage.setItem(storageKey, JSON.stringify({ version: 1, drafts: saved })); setPendingStorage(false); setMessage('Draft saved in this browser.'); }
    catch { setPendingStorage(true); setMessage('Storage is unavailable or full. Draft kept for this session only.'); }
  }
  function deleteActive() {
    if (!active || !window.confirm('Delete this saved quote and discard any unsaved changes?')) return;
    const remaining = drafts.filter(d => d.id !== active.id);
    setDrafts(remaining); setActive(remaining[0] || newDraft(String(Date.now()))); setDirty(false);
    if (blocked) { setPendingStorage(true); setMessage('Draft removed for this session only.'); return; }
    try { localStorage.setItem(storageKey, JSON.stringify({ version: 1, drafts: remaining })); setMessage('Draft deleted.'); }
    catch { setPendingStorage(true); setMessage('Storage failed. Deletion is session-only; the saved draft may return after reload.'); }
  }
  if (!active) return <p role="status">Loading saved drafts…</p>;
  return <><div className="mb-4 flex flex-wrap items-end gap-3 print:hidden"><div><label htmlFor="draft-picker">Saved drafts</label><select id="draft-picker" className="h-10 max-w-full rounded border p-2" value={drafts.some(d => d.id === active.id) ? active.id : ''} onChange={e => { const selected = drafts.find(d => d.id === e.target.value); if (selected && canLeave()) { setActive(selected); setDirty(false); } }}><option value="" disabled>Unsaved quote</option>{drafts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div><Button type="button" onClick={() => { if (canLeave()) { setActive(newDraft(String(Date.now()))); setDirty(false); } }}>New quote</Button><Button type="button" variant="outline" disabled={!drafts.some(d => d.id === active.id)} onClick={deleteActive}>Delete draft</Button></div><p role="status" className="mb-4 print:hidden">{message}</p><QuoteForm key={active.id} initial={active} onSave={save} onDirty={setDirty} /></>;
}
