"use client";
import { useEffect, useRef, useState } from "react";
import { QuoteForm } from "@/components/quote-form";
import { Button } from "@/components/ui/button";
import { newDraft, parseDrafts, validDraft, type Draft } from "@/lib/drafts";
import { duplicateDraft, searchDrafts, orderDrafts } from "@/lib/quote-operations";
import { Input } from "@/components/ui/input";
import { downloadBackup, parseBackup, mergeBackup, readBackupFile } from "@/lib/backups";
const storageKey = "quote-builder-drafts-v1";
export function DraftWorkspace() {
  const [search,setSearch]=useState('');
  const [order,setOrder]=useState('added');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [active, setActive] = useState<Draft | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pendingStorage, setPendingStorage] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const saved = raw === null ? [] : parseDrafts(raw);
      setDrafts(saved);
      setActive(saved[0] || newDraft("first"));
    } catch {
      setBlocked(true);
      setActive(newDraft("session"));
      setMessage(
        "Saved drafts could not be read. Session-only changes will leave the saved data untouched.",
      );
    }
  }, []);
  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (dirty || pendingStorage) {
        event.preventDefault();
        event.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, pendingStorage]);
  useEffect(() => {
    function changed(event: StorageEvent) {
      if (event.key === storageKey || event.key === null) {
        setBlocked(true);
        setMessage(
          "Saved drafts changed in another tab. Reload before saving; session changes will not overwrite them.",
        );
      }
    }
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, []);
  const draftsRef=useRef(drafts); draftsRef.current=drafts;
  const dirtyRef=useRef(dirty); dirtyRef.current=dirty;
  async function importFile(file:File) {
    try {
      const incoming=await readBackupFile(file);
      const merged=mergeBackup(draftsRef.current,incoming);
      if(incoming.length===0){setMessage('The backup contains no drafts. Nothing was changed.');return;}
      if(!window.confirm(incoming.length+' draft(s) ready to import. '+(dirtyRef.current ? 'Import drafts and discard unsaved quote changes? Saved drafts are kept. Cancel to save your edits first.' : 'Import saved drafts? Your existing saved drafts will be kept.')))return;
      setDrafts(merged);setActive(merged[merged.length-incoming.length]||newDraft(String(Date.now())));setDirty(false);
      if(blocked){setPendingStorage(true);setMessage('Imported drafts are session-only. Existing unreadable storage was preserved.');return;}
      try{localStorage.setItem(storageKey,JSON.stringify({version:1,drafts:merged}));setPendingStorage(false);setMessage('Quote backup imported.');}catch{setPendingStorage(true);setMessage('Imported drafts are session-only because storage is unavailable or full.');}
    } catch(error){setMessage((error as Error).message || 'The backup could not be read. Existing drafts are unchanged.');}
  }
  function canLeave() {
    return !dirtyRef.current || window.confirm("Discard unsaved changes to this quote?");
  }
  function save(draft: Draft) {
    if (!validDraft(draft)) {
      setMessage(
        "The draft has invalid values. Check the fields before saving.",
      );
      return;
    }
    const saved = drafts.some((d) => d.id === draft.id)
      ? drafts.map((d) => (d.id === draft.id ? draft : d))
      : [...drafts, draft];
    if (saved.length > 20) {
      setMessage("Keep at most 20 drafts. Delete a saved draft first.");
      return;
    }
    setDrafts(saved);
    setActive(draft);
    setDirty(false);
    if (blocked) {
      setPendingStorage(true);
      setMessage(
        "Draft kept for this session only. Unreadable saved data was not changed.",
      );
      return;
    }
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ version: 1, drafts: saved }),
      );
      setPendingStorage(false);
      setMessage("Draft saved in this browser.");
    } catch {
      setPendingStorage(true);
      setMessage(
        "Storage is unavailable or full. Draft kept for this session only.",
      );
    }
  }
  function deleteActive() {
    if (
      !active ||
      !window.confirm(
        "Delete this saved quote and discard any unsaved changes?",
      )
    )
      return;
    const remaining = drafts.filter((d) => d.id !== active.id);
    setDrafts(remaining);
    setActive(remaining[0] || newDraft(String(Date.now())));
    requestAnimationFrame(()=>document.getElementById("quote-name")?.focus());
    setDirty(false);
    if (blocked) {
      setPendingStorage(true);
      setMessage("Draft removed for this session only.");
      return;
    }
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ version: 1, drafts: remaining }),
      );
      setPendingStorage(false);
      setMessage("Draft deleted.");
    } catch {
      setPendingStorage(true);
      setMessage(
        "Storage failed. Deletion is session-only; the saved draft may return after reload.",
      );
    }
  }
  if (!active) return <p role="status">Loading saved drafts…</p>;
  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 print:hidden"><div><label htmlFor="draft-search">Find saved drafts</label><Input id="draft-search" value={search} onChange={e=>setSearch(e.target.value)} /></div><div><label htmlFor="draft-order">Draft order</label><select id="draft-order" className="h-10 rounded border p-2" value={order} onChange={e=>setOrder(e.target.value)}><option value="added">Saved order</option><option value="name">Name A–Z</option></select></div></div>
      <div className="mb-4 flex flex-wrap items-end gap-3 print:hidden">
        <div className="min-w-0 max-w-full">
          <label htmlFor="draft-picker">Saved drafts</label>
          <select
            id="draft-picker"
            className="h-10 max-w-full rounded border p-2"
            value={drafts.some((d) => d.id === active.id) ? active.id : ""}
            onChange={(e) => {
              const selected = drafts.find((d) => d.id === e.target.value);
              if (selected && canLeave()) {
                setActive(selected);
                setDirty(false);
              }
            }}
          >
            <option value="" disabled>
              Unsaved quote
            </option>
            {orderDrafts(drafts.filter(d=>d.id===active.id || searchDrafts([d],search).length>0),order).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="button"
          onClick={() => {
            if (canLeave()) {
              setActive(newDraft(String(Date.now())));
              setDirty(false);
            }
          }}
        >
          New quote
        </Button>
        <Button type="button" variant="outline" disabled={!drafts.some(d=>d.id===active.id) || drafts.length>=20} onClick={()=>{if(!canLeave())return;try{save(duplicateDraft(drafts,active));setSearch('');}catch(error){setMessage((error as Error).message);}}}>Duplicate quote</Button>
        <Button
          type="button"
          variant="outline"
          disabled={!drafts.some((d) => d.id === active.id)}
          onClick={deleteActive}
        >
          Delete draft
        </Button>
      </div>
      <details className="my-4 print:hidden"><summary className="cursor-pointer font-medium">Import or export quote backups</summary><div className="mt-3"><Button type="button" variant="outline" onClick={()=>{try{downloadBackup(drafts);setMessage('Saved drafts exported. Unfinished quote or template edits are not included.');}catch{setMessage('The backup download could not start. Keep this page open and try again.');}}}>Export saved drafts</Button><label htmlFor="quote-backup" className="mt-3">Import quote backup</label><input id="quote-backup" type="file" accept=".json,application/json" onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void importFile(file);}} /></div></details>
      {pendingStorage ? <p className="rounded border border-amber-700 p-3 print:hidden">Some draft changes are only in this session. Export saved drafts before closing this page.</p> : null}
      <p className="print:hidden">{searchDrafts(drafts,search).length} saved drafts match. The current quote remains available.</p>
      <p className="text-sm print:hidden">{dirty ? 'Quote has unsaved changes.' : drafts.some(d=>d.id===active.id) ? 'Quote matches its saved draft.' : 'New quote — not saved yet.'}</p>
      <p role="status" className="mb-4 print:hidden">
        {message}
      </p>
      <QuoteForm
        initial={active}
        onSave={save}
        onDirty={setDirty}
      />
    </>
  );
}
