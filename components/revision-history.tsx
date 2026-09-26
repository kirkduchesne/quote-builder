'use client';
import { useEffect, useRef, useState } from 'react';
import { type Draft } from '@/lib/drafts';
import { calculateTotal, dollars } from '@/lib/money';
import { downloadBackup } from '@/lib/backups';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { NativeSelect } from '@/components/ui/native-select';
import { RestoreIcon, SaveIcon } from '@/components/icons';
import {
  captureRevision,
  renameRevision,
  deleteRevision,
  type Revision,
} from '@/lib/revisions';
import { loadRevisions, saveRevisions } from '@/lib/revision-storage';

export function RevisionHistory({
  savedQuote,
  savedIds,
  onRestore,
  onSourcesChange,
}: {
  savedQuote?: Draft;
  savedIds: string[];
  onSourcesChange: (ids: string[]) => void;
  onRestore: (quote: Draft, reservedIds: string[]) => void;
}) {
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
    const loaded = loadRevisions({
      getItem: (key) => localStorage.getItem(key),
    });
    onSourcesChange(loaded.revisions.map((revision) => revision.quote.id));
    setHistory(loaded.revisions);
    raw.current = loaded.raw;
    setReadable(loaded.readable);
    setReady(true);
  }, []);
  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (pending || editing !== null) {
        event.preventDefault();
        event.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [pending, editing]);
  function persist(next: Revision[], success: string) {
    onSourcesChange(next.map((revision) => revision.quote.id));
    setHistory(next);
    try {
      if (!readable) throw new Error('Unreadable storage');
      raw.current = saveRevisions(localStorage, next, raw.current);
      setPending(false);
      setMessage(success);
    } catch {
      setPending(true);
      setMessage(
        'Revision changes are session-only. Existing storage was preserved. Keep this page open until you save a portable copy.',
      );
    }
  }
  function capture() {
    if (!savedQuote) return;
    try {
      let id = String(Date.now());
      while (history.some((revision) => revision.id === id)) id += '-copy';
      persist(
        captureRevision(history, savedQuote, id, new Date().toISOString()),
        'Saved quote captured.',
      );
    } catch (error) {
      setMessage((error as Error).message);
    }
  }
  return (
    <details className="disclosure group rounded-lg border bg-card shadow-soft print:hidden">
      <summary className="px-5 py-4">
        <RestoreIcon className="h-4 w-4 text-primary" />
        <span className="font-display text-lg font-semibold">
          Saved revision history
        </span>
        {ready && history.length > 0 ? (
          <Badge
            aria-hidden="true"
            variant="secondary"
            className="ml-auto tabular-nums"
          >
            {history.length}/40
          </Badge>
        ) : null}
      </summary>
      <div className="space-y-4 border-t px-5 pb-5 pt-4">
        {!ready ? (
          <p role="status" className="text-sm text-muted-foreground">
            Loading revision history…
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Revisions are independent copies of saved quotes. Keep five per
              quote and forty in this browser.
            </p>
            {!readable && (
              <Alert as="p" variant="destructive" role="alert">
                Revision storage could not be read. Existing data will remain
                untouched.
              </Alert>
            )}
            <div className="rounded-md bg-muted/60 p-3">
              <p className="text-sm font-medium">
                {history.length === 0
                  ? 'No revisions captured yet.'
                  : history.length + ' saved revisions.'}
              </p>
              <Button
                type="button"
                size="sm"
                className="mt-3 w-full gap-2"
                ref={captureButton}
                disabled={!savedQuote || editing !== null}
                onClick={capture}
              >
                <SaveIcon />
                Capture saved quote
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                Unfinished quote edits are not captured. A sixth capture
                replaces this quote’s oldest revision.
              </p>
              {!savedQuote && (
                <p className="mt-2 text-xs font-medium text-brass-foreground">
                  Save a quote before capturing a revision.
                </p>
              )}
            </div>
            {pending && (
              <Alert as="p" variant="warning" role="alert">
                Revision changes are only in this session. Do not close this
                page before exporting or restoring a copy.
              </Alert>
            )}
            <p role="status" className="status-line text-sm text-primary">
              {message}
            </p>
            <div>
              <label htmlFor="revision-scope">Show revisions</label>
              <NativeSelect
                id="revision-scope"
                value={scope}
                onChange={(event) => setScope(event.target.value)}
              >
                <option value="all">All quotes</option>
                <option value="current">Current saved quote</option>
              </NativeSelect>
            </div>
            {history.length > 0 &&
              scope === 'current' &&
              !history.some(
                (revision) => revision.quote.id === savedQuote?.id,
              ) && (
                <p className="text-sm text-muted-foreground">
                  No revisions match this saved quote. Choose All quotes to see
                  other history.
                </p>
              )}
            <ul className="space-y-3">
              {history
                .filter(
                  (revision) =>
                    scope === 'all' || revision.quote.id === savedQuote?.id,
                )
                .map((revision) => (
                  <li
                    key={revision.id}
                    className="relative rounded-md border bg-background p-3 pl-4 before:absolute before:inset-y-3 before:left-0 before:w-1 before:rounded-r before:bg-brass"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-medium [overflow-wrap:anywhere]">
                          {revision.label}
                        </h3>
                        <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">
                          {revision.quote.name} ·{' '}
                          {new Date(revision.capturedAt).toLocaleString()}
                        </p>
                      </div>
                      <p className="shrink-0 text-right text-sm font-semibold tabular-nums">
                        {dollars(
                          calculateTotal(
                            revision.quote.items,
                            revision.quote.discount,
                          ).total,
                        )}
                        <span className="block text-xs font-normal text-muted-foreground">
                          {revision.quote.items.length} lines
                        </span>
                      </p>
                    </div>
                    {!savedIds.includes(revision.quote.id) && (
                      <p className="mt-2 text-xs text-brass-foreground">
                        Source quote is no longer saved. Restore this revision
                        to recover a new independent draft.
                      </p>
                    )}
                    {editing === revision.id ? (
                      <form
                        className="mt-3 space-y-2"
                        onSubmit={(event) => {
                          event.preventDefault();
                          try {
                            persist(
                              renameRevision(history, revision.id, label),
                              'Revision label saved.',
                            );
                            setEditing(null);
                            requestAnimationFrame(
                              () => captureButton.current?.focus(),
                            );
                          } catch (error) {
                            setMessage((error as Error).message);
                          }
                        }}
                      >
                        <label htmlFor="revision-label">Revision label</label>
                        <Input
                          ref={labelInput}
                          id="revision-label"
                          value={label}
                          maxLength={80}
                          required
                          onChange={(event) => setLabel(event.target.value)}
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button type="submit" size="sm">
                            Save revision label
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditing(null);
                              captureButton.current?.focus();
                            }}
                          >
                            Cancel revision label
                          </Button>
                        </div>
                      </form>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5"
                        onClick={() =>
                          onRestore(
                            revision.quote,
                            history.map((item) => item.quote.id),
                          )
                        }
                      >
                        <RestoreIcon className="h-3.5 w-3.5" />
                        Restore
                        <span className="sr-only"> revision {revision.label}</span>{' '}
                        as new quote
                      </Button>
                      {editing !== revision.id ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => {
                            if (
                              editing !== null &&
                              !window.confirm(
                                'Discard unfinished revision label?',
                              )
                            )
                              return;
                            setEditing(revision.id);
                            setLabel(revision.label);
                            requestAnimationFrame(
                              () => labelInput.current?.focus(),
                            );
                          }}
                        >
                          Rename
                          <span className="sr-only"> revision {revision.label}</span>
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => {
                          try {
                            downloadBackup([revision.quote]);
                            setMessage(
                              'Revision exported as a standard quote backup.',
                            );
                          } catch {
                            setMessage(
                              'Revision download could not start. Keep this page open and try again.',
                            );
                          }
                        }}
                      >
                        Export
                        <span className="sr-only"> revision {revision.label}</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={editing !== null}
                        onClick={() => {
                          if (
                            window.confirm(
                              'Delete revision “' +
                                revision.label +
                                '”? This does not delete the saved quote.',
                            )
                          ) {
                            persist(
                              deleteRevision(history, revision.id),
                              'Revision deleted.',
                            );
                            requestAnimationFrame(
                              () => captureButton.current?.focus(),
                            );
                          }
                        }}
                      >
                        Delete
                        <span className="sr-only"> revision {revision.label}</span>
                      </Button>
                    </div>
                  </li>
                ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              Revision storage:{' '}
              {pending
                ? 'session-only changes need a portable copy'
                : readable
                ? 'loaded successfully'
                : 'unreadable saved data protected'}
              .
            </p>
          </>
        )}
      </div>
    </details>
  );
}
