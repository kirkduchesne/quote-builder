'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parseCents, dollars } from '@/lib/money';
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  searchTemplates,
  type Template,
} from '@/lib/templates';
import { downloadTemplateBackup, readTemplateBackupFile, mergeTemplateBackup } from '@/lib/template-backups';
import { loadTemplates, saveTemplates } from '@/lib/template-storage';
export function TemplateManager({
  onInsert,
}: {
  onInsert: (template: Template) => void;
}) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const templatesRef = useRef<Template[]>([]);
  const importBusy = useRef(false);
  const [importing, setImporting] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  const nameInput = useRef<HTMLInputElement>(null);
  const raw = useRef<string | null>(null);
  const readable = useRef(false);
  useEffect(() => {
    const loaded = loadTemplates({
      getItem: (key) => localStorage.getItem(key),
    });
    templatesRef.current = loaded.templates;
    setTemplates(loaded.templates);
    raw.current = loaded.raw;
    readable.current = loaded.readable;
    if (!loaded.readable)
      setMessage(
        'Saved templates could not be read. Changes will be session-only and leave saved data untouched.'
      );
    setReady(true);
  }, []);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [editing, setEditing] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState(false);
  useEffect(() => {
    function warn(e: BeforeUnloadEvent) {
      if (
        pending ||
        name ||
        description ||
        price ||
        quantity !== '1' ||
        editing !== null
      ) {
        e.preventDefault();
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [pending, name, description, price, quantity, editing]);
  function persist(next: Template[]) {
    templatesRef.current = next;
    setTemplates(next);
    try {
      if (!readable.current)
        throw Error('Unreadable saved templates are protected.');
      raw.current = saveTemplates(localStorage, next, raw.current);
      setPending(false);
      setMessage('Service templates saved.');
    } catch (error) {
      setPending(true);
      setMessage((error as Error).message + ' Changes are session-only.');
    }
  }
  async function importFile(file: File) {
    if (importBusy.current) return;
    importBusy.current = true;
    setImporting(true);
    try {
      const incoming = await readTemplateBackupFile(file);
      if (incoming.length === 0) { setMessage('The template backup is empty. Nothing changed.'); return; }
      const merged = mergeTemplateBackup(templatesRef.current, incoming);
      if (!window.confirm('Import ' + incoming.length + ' service templates (' + (30 - merged.length) + ' spaces remain afterward)? Existing templates and unfinished edits are kept.')) { setMessage('Template import cancelled. Templates and unfinished edits are unchanged.'); return; }
      persist(merged);
    } catch (error) { setMessage((error as Error).message); }
    finally { importBusy.current = false; setImporting(false); }
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const cents = parseCents(price);
    try {
      if (cents === null)
        throw Error('Enter a price with at most two decimals.');
      const fields = {
        name: name.trim(),
        description: description.trim(),
        quantity: Number(quantity),
        cents,
      };
      persist(
        editing === null
          ? createTemplate(templates, fields)
          : updateTemplate(templates, { ...fields, id: editing })
      );
      setName('');
      setDescription('');
      setQuantity('1');
      setPrice('');
      setEditing(null);
      nameInput.current?.focus();
    } catch (error) {
      setMessage((error as Error).message);
    }
  }
  return (
    <section
      aria-labelledby="templates-title"
      className="mb-6 rounded border p-4 print:hidden"
    >
      <details>
        <summary
          id="templates-title"
          className="cursor-pointer text-lg font-semibold"
        >
          Reusable service templates
        </summary>
        <details className="my-3">
          <summary className="cursor-pointer font-medium">Import or export service templates</summary>
          <Button type="button" variant="outline" disabled={!ready} onClick={() => {
            try { downloadTemplateBackup(templates); setMessage('Saved service templates exported. Unfinished edits are excluded.'); }
            catch { setMessage('Template download could not start. Keep this page open and try again.'); }
          }}>Export service templates</Button>
          <label htmlFor="template-backup" className="mt-3">Import service-template backup</label>
          <input id="template-backup" type="file" accept=".json,application/json" disabled={!ready || importing} onChange={event => {
            const file = event.target.files?.[0]; event.target.value = '';
            if (file) void importFile(file);
          }} />
          {importing && <p role="status">Reading service-template backup…</p>}
        </details>
        {importing && (name || description || price || quantity !== '1' || editing !== null) && <p className="text-sm">Your unfinished template stays open during import. Save it separately when ready.</p>}
        <form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="template-name">Template name</label>
            <Input
              ref={nameInput}
              id="template-name"
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="template-description">Template description</label>
            <Input
              id="template-description"
              value={description}
              maxLength={120}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="template-quantity">Template quantity</label>
            <Input
              id="template-quantity"
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="template-price">Template unit price (USD)</label>
            <Input
              id="template-price"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          <Button disabled={!ready} type="submit">
            {editing === null ? 'Save template' : 'Update template'}
          </Button>
          {editing !== null ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditing(null);
                setName('');
                setDescription('');
                setQuantity('1');
                setPrice('');
              }}
            >
              Cancel template edit
            </Button>
          ) : null}
        </form>
        {pending && <p className="rounded border border-amber-700 p-3">Template changes are session-only. Export service templates before closing; unfinished form edits must be saved first.</p>}
        <p role="status">{ready ? message : 'Loading templates…'}</p>
        <label htmlFor="template-search">Find a service template</label>
        <Input
          id="template-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <p className="text-sm">Template storage: {!ready ? 'loading' : pending ? 'session-only changes need export' : readable.current ? 'loaded successfully' : 'unreadable saved data protected'}.</p>
        <p className="text-sm">{30 - templates.length} service template spaces remaining.</p>
        <p>{searchTemplates(templates, search).length} matching templates</p>
        <ul>
          {searchTemplates(templates, search).map((template) => (
            <li className="mt-3 border-t pt-3" key={template.id}>
              <Button
                type="button"
                variant="outline"
                onClick={() => onInsert(template)}
              >
                Use template {template.name}
              </Button>
              <strong>{template.name}</strong>
              <Button
                type="button"
                variant="ghost"
                disabled={editing !== null}
                onClick={() => {
                  if (
                    window.confirm(
                      'Delete service template ' + template.name + '?'
                    )
                  )
                    persist(deleteTemplate(templates, template.id));
                }}
              >
                Delete template {template.name}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (
                    (name ||
                      description ||
                      price ||
                      quantity !== '1' ||
                      editing !== null) &&
                    !window.confirm('Discard unfinished template edits?')
                  )
                    return;
                  setEditing(template.id);
                  setName(template.name);
                  setDescription(template.description);
                  setQuantity(String(template.quantity));
                  setPrice((template.cents / 100).toFixed(2));
                }}
              >
                Edit template {template.name}
              </Button>
              <p>
                {template.description} · {template.quantity} ×{' '}
                {dollars(template.cents)}
              </p>
            </li>
          ))}
        </ul>
        {!templates.length ? <p>No service templates yet.</p> : null}
      </details>
    </section>
  );
}
