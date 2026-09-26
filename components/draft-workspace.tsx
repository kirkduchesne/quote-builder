'use client';
import { loadRevisions } from '@/lib/revision-storage';
import { restoredDraft } from '@/lib/revisions';
import { calculateTotal, dollars } from '@/lib/money';
import { visibleDrafts } from '@/lib/organization';
import { useOrganization } from '@/components/use-organization';
import { useEffect, useRef, useState } from 'react';
import { RevisionHistory } from '@/components/revision-history';
import { QuoteForm } from '@/components/quote-form';
import { Button } from '@/components/ui/button';
import {
  newDraft,
  unusedDraftId,
  parseDrafts,
  validDraft,
  type Draft,
} from '@/lib/drafts';
import {
  duplicateDraft,
  searchDrafts,
  orderDrafts,
} from '@/lib/quote-operations';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { NativeSelect } from '@/components/ui/native-select';
import { Separator } from '@/components/ui/separator';
import {
  ArchiveIcon,
  CopyIcon,
  DownloadIcon,
  FolderIcon,
  PlusIcon,
  TrashIcon,
} from '@/components/icons';
import {
  downloadBackup,
  parseBackup,
  mergeBackup,
  readBackupFile,
} from '@/lib/backups';
import { writeDrafts } from '@/lib/draft-storage';
const storageKey = 'quote-builder-drafts-v1';
export function DraftWorkspace() {
  const organizationState = useOrganization();
  const revisionSourceIds = useRef<string[]>([]);
  const savedRaw = useRef<string | null>(null);
  const [archiveScope, setArchiveScope] = useState('active');
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState('added');
  const importBusy = useRef(false);
  const [importing, setImporting] = useState(false);
  const [resetVersion, setResetVersion] = useState(0);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [active, setActive] = useState<Draft | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pendingStorage, setPendingStorage] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    revisionSourceIds.current = loadRevisions({
      getItem: (key) => localStorage.getItem(key),
    }).revisions.map((revision) => revision.quote.id);
    try {
      const raw = localStorage.getItem(storageKey);
      savedRaw.current = raw;
      const saved = raw === null ? [] : parseDrafts(raw);
      updateCollection(saved);
      setActive(
        saved[0] || newDraft(unusedDraftId(saved, revisionSourceIds.current)),
      );
    } catch {
      setBlocked(true);
      setActive(newDraft(unusedDraftId([], revisionSourceIds.current)));
      setMessage(
        'Saved drafts could not be read. Session-only changes will leave the saved data untouched.',
      );
    }
  }, []);
  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (dirty || pendingStorage) {
        event.preventDefault();
        event.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, pendingStorage]);
  useEffect(() => {
    function changed(event: StorageEvent) {
      if (event.key === storageKey || event.key === null) {
        setBlocked(true);
        setMessage(
          'Saved drafts changed in another tab. Reload before saving; session changes will not overwrite them.',
        );
      }
    }
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, []);
  const draftsRef = useRef(drafts);
  draftsRef.current = drafts;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  function updateCollection(next: Draft[]) {
    draftsRef.current = next;
    setDrafts(next);
  }
  async function importFile(file: File) {
    if (importBusy.current) {
      setMessage('A backup is already being read. Please wait.');
      return;
    }
    importBusy.current = true;
    setImporting(true);
    try {
      const incoming = await readBackupFile(file);
      const merged = mergeBackup(
        draftsRef.current,
        incoming,
        revisionSourceIds.current,
      );
      if (incoming.length === 0) {
        setMessage('The backup contains no drafts. Nothing was changed.');
        return;
      }
      if (
        !window.confirm(
          incoming.length +
            ' draft(s) ready to import. ' +
            (dirtyRef.current
              ? 'Import drafts and discard unsaved quote changes? Saved drafts are kept. Cancel to save your edits first.'
              : 'Import saved drafts? Your existing saved drafts will be kept.'),
        )
      ) {
        setMessage(
          'Quote import cancelled. Saved drafts and unfinished edits are unchanged.',
        );
        return;
      }
      setResetVersion((value) => value + 1);
      updateCollection(merged);
      setActive(
        merged[merged.length - incoming.length] ||
          newDraft(unusedDraftId(draftsRef.current, revisionSourceIds.current)),
      );
      setDirty(false);
      if (blocked) {
        setPendingStorage(true);
        setMessage(
          'Imported drafts are session-only. Existing unreadable storage was preserved.',
        );
        return;
      }
      try {
        savedRaw.current = writeDrafts(
          localStorage,
          storageKey,
          merged,
          savedRaw.current,
        );
        setPendingStorage(false);
        setMessage('Quote backup imported.');
      } catch {
        setPendingStorage(true);
        setMessage(
          'Imported drafts are session-only because storage is unavailable or full.',
        );
      }
    } catch (error) {
      setMessage(
        (error as Error).message ||
          'The backup could not be read. Existing drafts are unchanged.',
      );
    } finally {
      importBusy.current = false;
      setImporting(false);
    }
  }
  function canLeave() {
    return (
      !dirtyRef.current ||
      window.confirm('Discard unsaved changes to this quote?')
    );
  }
  function save(draft: Draft) {
    if (!validDraft(draft)) {
      setMessage(
        'The draft has invalid values. Check the fields before saving.',
      );
      return;
    }
    const saved = drafts.some((d) => d.id === draft.id)
      ? drafts.map((d) => (d.id === draft.id ? draft : d))
      : [...drafts, draft];
    if (saved.length > 20) {
      setMessage('Keep at most 20 drafts. Delete a saved draft first.');
      return;
    }
    updateCollection(saved);
    setActive(draft);
    setDirty(false);
    if (blocked) {
      setPendingStorage(true);
      setMessage(
        'Draft kept for this session only. Unreadable saved data was not changed.',
      );
      return;
    }
    try {
      savedRaw.current = writeDrafts(
        localStorage,
        storageKey,
        saved,
        savedRaw.current,
      );
      setPendingStorage(false);
      setMessage('Draft saved in this browser.');
    } catch {
      setPendingStorage(true);
      setMessage(
        'Storage is unavailable or full. Draft kept for this session only.',
      );
    }
  }
  function deleteActive() {
    if (
      !active ||
      !window.confirm(
        'Delete this saved quote and discard any unsaved changes?',
      )
    )
      return;
    const remaining = drafts.filter((d) => d.id !== active.id);
    setResetVersion((value) => value + 1);
    updateCollection(remaining);
    const retainedIds = organizationState.organization.archivedIds.filter(
      (id) => remaining.some((draft) => draft.id === id),
    );
    if (
      retainedIds.length !== organizationState.organization.archivedIds.length
    )
      organizationState.persist({ archivedIds: retainedIds });
    setActive(
      remaining[0] ||
        newDraft(unusedDraftId(draftsRef.current, revisionSourceIds.current)),
    );
    requestAnimationFrame(() => document.getElementById('quote-name')?.focus());
    setDirty(false);
    if (blocked) {
      setPendingStorage(true);
      setMessage('Draft removed for this session only.');
      return;
    }
    try {
      savedRaw.current = writeDrafts(
        localStorage,
        storageKey,
        remaining,
        savedRaw.current,
      );
      setPendingStorage(false);
      setMessage('Draft deleted.');
    } catch {
      setPendingStorage(true);
      setMessage(
        'Storage failed. Deletion is session-only; the saved draft may return after reload.',
      );
    }
  }
  if (!active)
    return (
      <p role="status" className="text-muted-foreground">
        Loading saved drafts…
      </p>
    );
  const isSaved = drafts.some((d) => d.id === active.id);
  const isArchived = organizationState.organization.archivedIds.includes(
    active.id,
  );
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:gap-8 print:block">
      <aside
        aria-label="Quote library"
        className="min-w-0 space-y-6 print:hidden"
      >
        <Card className="shadow-soft">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 font-display text-xl">
                <FolderIcon className="h-5 w-5 text-primary" />
                Quote library
              </CardTitle>
              <Badge variant="brass" className="tabular-nums">
                {drafts.length}/20
              </Badge>
            </div>
            <CardDescription>
              {20 - drafts.length} saved draft spaces remaining.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="min-w-0 max-w-full">
              <label htmlFor="draft-picker">Saved drafts</label>
              <NativeSelect
                id="draft-picker"
                value={isSaved ? active.id : ''}
                onChange={(e) => {
                  const selected = drafts.find((d) => d.id === e.target.value);
                  if (selected && canLeave()) {
                    setResetVersion((value) => value + 1);
                    setActive(selected);
                    setDirty(false);
                  }
                }}
              >
                <option value="" disabled>
                  Unsaved quote
                </option>
                {orderDrafts(
                  drafts.filter(
                    (d) =>
                      d.id === active.id ||
                      (visibleDrafts(
                        [d],
                        organizationState.organization,
                        archiveScope,
                      ).length > 0 &&
                        searchDrafts([d], search).length > 0),
                  ),
                  order,
                ).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="gap-2"
                onClick={() => {
                  if (canLeave()) {
                    setResetVersion((value) => value + 1);
                    setActive(
                      newDraft(
                        unusedDraftId(
                          draftsRef.current,
                          revisionSourceIds.current,
                        ),
                      ),
                    );
                    setDirty(false);
                  }
                }}
              >
                <PlusIcon />
                New quote
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 gap-2"
                disabled={!isSaved || drafts.length >= 20}
                onClick={() => {
                  if (!canLeave()) return;
                  try {
                    save(
                      duplicateDraft(drafts, active, revisionSourceIds.current),
                    );
                    setSearch('');
                  } catch (error) {
                    setMessage((error as Error).message);
                  }
                }}
              >
                <CopyIcon />
                Duplicate quote
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={!isSaved}
                onClick={deleteActive}
              >
                <TrashIcon />
                Delete draft
              </Button>
            </div>
            <Separator />
            <div className="space-y-3">
              <p className="eyebrow">Filter the library</p>
              <div>
                <label htmlFor="draft-search">Find saved drafts</label>
                <Input
                  id="draft-search"
                  type="search"
                  placeholder="Name or reference"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="min-w-0">
                  <label htmlFor="archive-scope">Draft visibility</label>
                  <NativeSelect
                    id="archive-scope"
                    value={archiveScope}
                    onChange={(event) => setArchiveScope(event.target.value)}
                  >
                    <option value="active">Active drafts</option>
                    <option value="archived">Archived drafts</option>
                    <option value="all">All drafts</option>
                  </NativeSelect>
                </div>
                <div className="min-w-0">
                  <label htmlFor="draft-order">Draft order</label>
                  <NativeSelect
                    id="draft-order"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                  >
                    <option value="added">Saved order</option>
                    <option value="name">Name A–Z</option>
                  </NativeSelect>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {
                  searchDrafts(
                    visibleDrafts(
                      drafts,
                      organizationState.organization,
                      archiveScope,
                    ),
                    search,
                  ).length
                }{' '}
                saved drafts match this view. The current quote remains
                available.
              </p>
            </div>
            <Separator />
            <div className="space-y-3">
              <p className="eyebrow">Archive</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={!organizationState.ready || !isSaved}
                  onClick={() => {
                    organizationState.archive(active.id, !isArchived);
                  }}
                >
                  <ArchiveIcon />
                  {isArchived
                    ? 'Unarchive current draft'
                    : 'Archive current draft'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={
                    !organizationState.ready ||
                    !organizationState.organization.archivedIds.length
                  }
                  onClick={() => {
                    if (
                      window.confirm(
                        'Unarchive all drafts? Quote contents and unfinished edits are unchanged.',
                      )
                    )
                      organizationState.persist({ archivedIds: [] });
                  }}
                >
                  Unarchive all drafts
                </Button>
              </div>
              {isArchived && (
                <Alert as="p" variant="warning" className="font-medium">
                  Current draft is archived. It remains editable and printable.
                </Alert>
              )}
              <p className="text-xs text-muted-foreground">
                Archiving organizes saved drafts without changing quote contents
                or unfinished edits.
              </p>
              <p role="status" className="status-line text-sm text-primary">
                {organizationState.message}
              </p>
            </div>
            <Separator />
            <details className="disclosure group">
              <summary className="text-sm font-medium">
                Import or export quote backups
              </summary>
              <div className="mt-3 space-y-3">
                <p className="text-xs text-muted-foreground">
                  Exports include all saved drafts, including archived quotes.
                  Archive flags stay in this browser and are not included.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    try {
                      downloadBackup(drafts);
                      setMessage(
                        'Saved drafts exported. Unfinished quote or template edits are not included.',
                      );
                    } catch {
                      setMessage(
                        'The backup download could not start. Keep this page open and try again.',
                      );
                    }
                  }}
                >
                  <DownloadIcon />
                  Export saved drafts
                </Button>
                <div>
                  <label htmlFor="quote-backup">Import quote backup</label>
                  <input
                    id="quote-backup"
                    className="file-input"
                    disabled={importing}
                    type="file"
                    accept=".json,application/json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (file) void importFile(file);
                    }}
                  />
                </div>
              </div>
            </details>
            <details className="disclosure">
              <summary className="text-sm font-medium">Local data status</summary>
              <div className="mt-3 space-y-2 rounded-md bg-muted/60 p-3 text-sm">
                <p>
                  Saved quotes:{' '}
                  {pendingStorage
                    ? 'session-only changes need export'
                    : blocked
                    ? 'saved data protected from writes'
                    : 'loaded successfully'}
                  .
                </p>
                <p>
                  Draft organization:{' '}
                  {!organizationState.ready
                    ? 'loading'
                    : organizationState.pending
                    ? 'session-only metadata changes'
                    : organizationState.message.includes('could not be read')
                    ? 'unreadable metadata protected'
                    : 'loaded successfully'}
                  .
                </p>
                <p className="text-xs text-muted-foreground">
                  Template and revision storage status appears in their panels.
                  Downloads preserve quote or template contents; archive flags
                  stay in this browser.
                </p>
              </div>
            </details>
          </CardContent>
        </Card>
        <RevisionHistory
          onSourcesChange={(ids) => {
            revisionSourceIds.current = ids;
          }}
          savedIds={drafts.map((draft) => draft.id)}
          savedQuote={drafts.find((draft) => draft.id === active.id)}
          onRestore={(quote, reservedIds) => {
            if (!canLeave()) return;
            try {
              const copy = restoredDraft(quote, draftsRef.current, reservedIds);
              setResetVersion((value) => value + 1);
              save(copy);
              setSearch('');
              requestAnimationFrame(
                () => document.getElementById('quote-name')?.focus(),
              );
            } catch (error) {
              setMessage((error as Error).message);
            }
          }}
        />
      </aside>
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 print:hidden">
          <Badge
            variant={dirty ? 'brass' : isSaved ? 'secondary' : 'outline'}
            className="gap-1.5"
          >
            <span
              aria-hidden="true"
              className={
                'h-1.5 w-1.5 rounded-full ' +
                (dirty
                  ? 'bg-brass'
                  : isSaved
                  ? 'bg-primary'
                  : 'bg-muted-foreground')
              }
            />
            <span className="font-medium">
              {dirty
                ? 'Quote has unsaved changes.'
                : isSaved
                ? 'Quote matches its saved draft.'
                : 'New quote — not saved yet.'}
            </span>
          </Badge>
          {isSaved && (
            <p className="text-xs text-muted-foreground">
              Saved version: {active.items.length} line items ·{' '}
              {dollars(calculateTotal(active.items, active.discount).total)}.
              Unsaved form edits may differ.
            </p>
          )}
        </div>
        {importing ? (
          <p role="status" className="text-sm text-muted-foreground print:hidden">
            Reading quote backup…
          </p>
        ) : null}
        <p
          role="status"
          className="status-line rounded-md border border-primary/15 bg-accent/60 px-3 py-2 text-sm text-accent-foreground print:hidden"
        >
          {message}
        </p>
        {pendingStorage ? (
          <Alert as="p" variant="warning" className="print:hidden">
            Some draft changes are only in this session. Export saved drafts
            before closing this page.
          </Alert>
        ) : null}
        <QuoteForm
          resetVersion={resetVersion}
          initial={active}
          onSave={save}
          onDirty={setDirty}
        />
      </div>
    </div>
  );
}
