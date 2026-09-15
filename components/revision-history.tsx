'use client';
import { useEffect, useRef, useState } from 'react';
import { type Draft } from '@/lib/drafts';
import { calculateTotal, dollars } from '@/lib/money';
import { downloadBackup } from '@/lib/backups';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { captureRevision, renameRevision, deleteRevision, type Revision } from '@/lib/revisions';
import { loadRevisions, saveRevisions } from '@/lib/revision-storage';

export function RevisionHistory({ savedQuote, savedIds, onRestore }: { savedQuote?: Draft; savedIds: string[]; onRestore: (quote: Draft, reservedIds: string[]) => void }) {
  const [history, setHistory] = useState<Revision[]>([]);
  const [ready, setReady] = useState(false);
  const [readable, setReadable] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [scope, setScope] = useState('all');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const captureButton = useRef<HTMLButtonElement>(null);
  const labelInput = useRef<HTMLInputElement>(null);
  const raw = useRef<string | null>(null);
  useEffect(() => {
    const loaded = loadRevisions({ getItem: key => localStorage.getItem(key) });
    setHistory(loaded.revisions);
    raw.current = loaded.raw;
    setReadable(loaded.readable);
    setReady(true);
  }, []);
  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (pending || editing !== null) { event.preventDefault(); event.returnValue = ''; }
    }
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [pending, editing]);
  function persist(next: Revision[], success: string) {
    setHistory(next);
    try {
      if (!readable) throw new Error('Unreadable storage');
      raw.current = saveRevisions(localStorage, next, raw.current);
      setPending(false);
      setMessage(success);
    } catch {
      setPending(true);
      setMessage('Revision changes are session-only. Existing storage was preserved. Keep this page open until you save a portable copy.');
    }
  }
  function capture() {
    if (!savedQuote) return;
    try {
      let id = String(Date.now());
      while (history.some(revision => revision.id === id)) id += '-copy';
      persist(captureRevision(history, savedQuote, id, new Date().toISOString()), 'Saved quote captured.');
    } catch (error) { setMessage((error as Error).message); }
  }
  return <details className="my-4 print:hidden">
    <summary className="cursor-pointer font-medium">Saved revision history</summary>
    {!ready ? <p role="status">Loading revision history…</p> : <>
      <p className="text-sm">Revision storage: {pending ? 'session-only changes need a portable copy' : readable ? 'loaded successfully' : 'unreadable saved data protected'}.</p>
      <p className="my-2 text-sm">Revisions are independent copies of saved quotes. Keep five per quote and forty in this browser.</p>
      {!readable && <p role="alert">Revision storage could not be read. Existing data will remain untouched.</p>}
      {history.length === 0 ? <p>No revisions captured yet.</p> : <p>{history.length} saved revisions.</p>}
      <Button type="button" variant="outline" ref={captureButton} disabled={!savedQuote || editing !== null} onClick={capture}>Capture saved quote</Button>
      <p className="text-sm">Unfinished quote edits are not captured. A sixth capture replaces this quote’s oldest revision.</p>
      {pending && <p role="alert">Revision changes are only in this session. Do not close this page before exporting or restoring a copy.</p>}
      <p role="status">{message}</p>
      <label htmlFor="revision-scope">Show revisions</label>
      <select id="revision-scope" value={scope} onChange={event => setScope(event.target.value)} className="my-2 rounded border p-2">
        <option value="all">All quotes</option><option value="current">Current saved quote</option>
      </select>
      {history.length > 0 && scope === 'current' && !history.some(revision => revision.quote.id === savedQuote?.id) && <p>No revisions match this saved quote. Choose All quotes to see other history.</p>}
      <ul className="my-3 space-y-3">
        {history.filter(revision => scope === 'all' || revision.quote.id === savedQuote?.id).map(revision => <li key={revision.id} className="rounded border p-3">
          {editing === revision.id ? <form onSubmit={event => {
            event.preventDefault();
            try { persist(renameRevision(history, revision.id, label), 'Revision label saved.'); setEditing(null); requestAnimationFrame(() => captureButton.current?.focus()); }
            catch (error) { setMessage((error as Error).message); }
          }}>
            <label htmlFor="revision-label">Revision label</label>
            <Input ref={labelInput} id="revision-label" value={label} maxLength={80} required onChange={event => setLabel(event.target.value)} />
            <Button type="submit">Save revision label</Button>
            <Button type="button" variant="outline" onClick={() => { setEditing(null); captureButton.current?.focus(); }}>Cancel revision label</Button>
          </form> : <Button type="button" variant="outline" onClick={() => {
            if (editing !== null && !window.confirm('Discard unfinished revision label?')) return;
            setEditing(revision.id); setLabel(revision.label); requestAnimationFrame(() => labelInput.current?.focus());
          }}>Rename revision {revision.label}</Button>}
          <Button type="button" variant="ghost" disabled={editing !== null} onClick={() => {
            if (window.confirm('Delete revision “' + revision.label + '”? This does not delete the saved quote.')) {
              persist(deleteRevision(history, revision.id), 'Revision deleted.'); requestAnimationFrame(() => captureButton.current?.focus());
            }
          }}>Delete revision {revision.label}</Button>
          <Button type="button" variant="outline" onClick={() => onRestore(revision.quote, history.map(item => item.quote.id))}>Restore revision {revision.label} as new quote</Button>
          {!savedIds.includes(revision.quote.id) && <p className="text-sm">Source quote is no longer saved. Restore this revision to recover a new independent draft.</p>}
          <Button type="button" variant="outline" onClick={() => {
            try { downloadBackup([revision.quote]); setMessage('Revision exported as a standard quote backup.'); }
            catch { setMessage('Revision download could not start. Keep this page open and try again.'); }
          }}>Export revision {revision.label}</Button>
          <h3 className="font-medium">{revision.label}</h3>
          <p className="text-sm">{revision.quote.name} · {new Date(revision.capturedAt).toLocaleString()}</p>
          <p className="text-sm">{revision.quote.items.length} lines · {dollars(calculateTotal(revision.quote.items, revision.quote.discount).total)}</p>
        </li>)}
      </ul>
      {!savedQuote && <p>Save a quote before capturing a revision.</p>}
    </>}
  </details>;
}
