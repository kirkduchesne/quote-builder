'use client';
import { useEffect, useRef, useState } from 'react';
import { type Draft } from '@/lib/drafts';
import { type Revision } from '@/lib/revisions';
import { loadRevisions } from '@/lib/revision-storage';

export function RevisionHistory({ savedQuote }: { savedQuote?: Draft }) {
  const [history, setHistory] = useState<Revision[]>([]);
  const [ready, setReady] = useState(false);
  const [readable, setReadable] = useState(true);
  const raw = useRef<string | null>(null);
  useEffect(() => {
    const loaded = loadRevisions(localStorage);
    setHistory(loaded.revisions);
    raw.current = loaded.raw;
    setReadable(loaded.readable);
    setReady(true);
  }, []);
  return <details className="my-4 print:hidden">
    <summary className="cursor-pointer font-medium">Saved revision history</summary>
    {!ready ? <p role="status">Loading revision history…</p> : <>
      <p className="my-2 text-sm">Revisions are independent copies of saved quotes. Keep five per quote and forty in this browser.</p>
      {!readable && <p role="alert">Revision storage could not be read. Existing data will remain untouched.</p>}
      {history.length === 0 ? <p>No revisions captured yet.</p> : <p>{history.length} saved revisions.</p>}
      {!savedQuote && <p>Save a quote before capturing a revision.</p>}
    </>}
  </details>;
}
