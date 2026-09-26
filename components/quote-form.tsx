'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TallyleafMark } from '@/components/brand';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CopyIcon,
  PencilIcon,
  PlusIcon,
  PrinterIcon,
  SaveIcon,
  TrashIcon,
} from '@/components/icons';
import { calculateTotal, dollars, parseCents } from '@/lib/money';

import {
  type Draft,
  type Item,
  newDraft,
  unusedItemId,
  normalizedQuoteName,
} from '@/lib/drafts';
import { TemplateManager } from '@/components/template-manager';
import { templateItem } from '@/lib/templates';
import {
  duplicateLine,
  moveLineUp,
  moveLineDown,
} from '@/lib/quote-operations';
const blank = newDraft('unsaved');

export function QuoteForm({
  initial = blank,
  resetVersion = 0,
  onSave,
  onDirty,
}: {
  initial?: Draft;
  resetVersion?: number;
  onSave?: (draft: Draft) => void;
  onDirty?: (dirty: boolean) => void;
}) {
  const [items, setItems] = useState<Item[]>(initial.items);
  const [editing, setEditing] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');
  const [discount, setDiscount] = useState(String(initial.discount));
  const validDiscount = /^\d{1,3}$/.test(discount) && Number(discount) <= 100;
  const totals = calculateTotal(items, validDiscount ? Number(discount) : 0);
  const [name, setName] = useState(initial.name);
  const [reference, setReference] = useState(initial.reference);
  const [notes, setNotes] = useState(initial.notes);
  const mounted = useRef(false);
  useEffect(() => {
    // State already starts from `initial`; resetting on mount would wipe
    // anything typed before this deferred effect runs.
    if (!mounted.current) {
      mounted.current = true;
      requestAnimationFrame(() => {
        if (document.activeElement === document.body)
          document.getElementById('quote-name')?.focus();
      });
      return;
    }
    setItems(initial.items);
    setName(initial.name);
    setReference(initial.reference);
    setNotes(initial.notes);
    setDiscount(String(initial.discount));
    setEditing(null);
    setDescription('');
    setQuantity('1');
    setPrice('');
    setMessage('');
    requestAnimationFrame(() => document.getElementById('quote-name')?.focus());
  }, [initial.id, resetVersion]);
  useEffect(() => {
    onDirty?.(
      JSON.stringify({
        ...initial,
        name: normalizedQuoteName(name)!,
        reference,
        notes,
        items,
        discount: Number(discount),
      }) !== JSON.stringify({ ...initial, name: initial.name.trim() }) ||
        editing !== null ||
        !!description ||
        !!price ||
        quantity !== '1',
    );
  }, [
    name,
    reference,
    notes,
    items,
    discount,
    initial,
    onDirty,
    description,
    editing,
    price,
    quantity,
  ]);
  const descriptionRef = useRef<HTMLInputElement>(null);
  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (items.length >= 100 && editing === null) {
      setMessage('A quote can contain at most 100 line items.');
      return;
    }
    const cents = parseCents(price);
    if (
      !description.trim() ||
      description.trim().length > 120 ||
      !/^\d{1,3}$/.test(quantity) ||
      Number(quantity) < 1 ||
      cents === null
    ) {
      setMessage(
        'Enter a description, quantity from 1 to 999, and price from 0 to 999999.99 with at most two decimals.',
      );
      return;
    }
    const item = {
      id: editing === null ? unusedItemId(items) : editing,
      description: description.trim(),
      quantity: Number(quantity),
      cents,
    };
    setItems(
      editing === null
        ? [...items, item]
        : items.map((row) => (row.id === editing ? item : row)),
    );
    setEditing(null);
    descriptionRef.current?.focus();
    setDescription('');
    setQuantity('1');
    setPrice('');
    setMessage('Item added.');
  }
  const lineOpen =
    editing !== null || !!description || !!price || quantity !== '1';
  return (
    <div
      id="quote-workspace"
      className="relative overflow-hidden rounded-xl border bg-paper shadow-sheet print:overflow-visible print:rounded-none print:border-0 print:shadow-none"
    >
      <div
        aria-hidden="true"
        className="h-1.5 bg-gradient-to-r from-primary via-primary to-brass print:hidden"
      />
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-dashed px-5 pb-5 pt-6 sm:px-8 print:hidden">
        <div className="min-w-0">
          <p className="eyebrow">Estimate worksheet</p>
          <p className="mt-1 font-display text-2xl font-semibold tracking-tight [overflow-wrap:anywhere]">
            {normalizedQuoteName(name) || 'Untitled quote'}
          </p>
        </div>
        <div className="text-right" aria-hidden="true">
          <p className="eyebrow">Running total</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-primary">
            {dollars(totals.total)}
          </p>
        </div>
      </div>
      <div className="hidden items-center gap-2 border-b pb-3 print:flex">
        <TallyleafMark className="h-6 w-6" />
        <span className="font-display text-base font-semibold">Tallyleaf</span>
      </div>
      <p className="mt-6 hidden text-sm uppercase tracking-wide print:block">
        Service estimate
      </p>
      <h2 className="hidden break-words font-display text-2xl font-semibold [overflow-wrap:anywhere] print:block">
        {name}
      </h2>
      {reference ? (
        <p className="hidden break-words [overflow-wrap:anywhere] print:block">
          <strong>Reference:</strong> {reference}
        </p>
      ) : null}
      <div className="space-y-6 px-5 py-6 sm:px-8 print:hidden">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="quote-name">Quote name</label>
            <Input
              id="quote-name"
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="reference">Reference</label>
            <Input
              id="reference"
              value={reference}
              maxLength={80}
              placeholder="e.g. PO or project code"
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
        </div>
        {description || price || editing !== null ? (
          <p className="text-sm text-muted-foreground">
            Using a service template will ask before replacing the unfinished
            line editor.
          </p>
        ) : null}
        <TemplateManager
          onInsert={(template) => {
            if (
              (description || price || quantity !== '1' || editing !== null) &&
              !window.confirm(
                'Discard the unfinished line item before using this template?',
              )
            )
              return;
            try {
              setItems([...items, templateItem(template, items)]);
              setEditing(null);
              setDescription('');
              setPrice('');
              setQuantity('1');
              setMessage('Service template added.');
            } catch (error) {
              setMessage((error as Error).message);
            }
          }}
        />
        <div
          className={
            'rounded-lg border p-4 transition-colors ' +
            (editing !== null
              ? 'border-brass/60 bg-brass-soft/60'
              : 'bg-muted/50')
          }
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="eyebrow">
              {editing === null ? 'New line item' : 'Editing line item'}
            </p>
            <kbd className="hidden rounded border bg-background px-1.5 py-0.5 font-sans text-[0.65rem] text-muted-foreground sm:inline">
              Esc clears
            </kbd>
          </div>
          {lineOpen ? (
            <p
              id="line-message"
              role="status"
              className="mb-3 text-sm text-warning"
            >
              A line is unfinished. Add or update it, or choose Cancel line
              before saving the draft.
            </p>
          ) : null}
          <form
            className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_6rem_9rem]"
            onSubmit={addItem}
            onKeyDown={(event) => {
              if (
                event.key === 'Escape' &&
                (editing !== null || description || price || quantity !== '1')
              ) {
                event.preventDefault();
                setEditing(null);
                setDescription('');
                setQuantity('1');
                setPrice('');
                setMessage('Line editor cleared.');
                descriptionRef.current?.focus();
              }
            }}
          >
            <div>
              <label htmlFor="description">Description</label>
              <Input
                ref={descriptionRef}
                id="description"
                aria-describedby="line-message"
                placeholder="What are you providing?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={120}
                required
              />
            </div>
            <div>
              <label htmlFor="quantity">Quantity</label>
              <Input
                id="quantity"
                aria-describedby="line-message"
                inputMode="numeric"
                className="tabular-nums"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="price">Unit price (USD)</label>
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                >
                  $
                </span>
                <Input
                  id="price"
                  aria-describedby="line-message"
                  inputMode="decimal"
                  placeholder="0.00"
                  className="pl-7 tabular-nums"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:col-span-3">
              <Button type="submit" className="gap-2">
                {editing === null ? <PlusIcon /> : <PencilIcon />}
                {editing === null ? 'Add item' : 'Update item'}
              </Button>
              {lineOpen ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditing(null);
                    setDescription('');
                    setQuantity('1');
                    setPrice('');
                  }}
                >
                  Cancel line
                </Button>
              ) : null}
            </div>
          </form>
        </div>
        <p role="status" className="status-line text-sm text-primary">
          {message}
        </p>
      </div>
      {items.length ? (
        <div
          aria-hidden="true"
          className="mx-5 hidden grid-cols-[2rem_minmax(0,1fr)_auto_10.75rem] gap-3 border-b-2 border-foreground/80 pb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:mx-8 sm:grid print:mx-0 print:grid print:grid-cols-[2rem_minmax(0,1fr)_auto]"
        >
          <span>#</span>
          <span>Description</span>
          <span className="text-right">Amount</span>
          <span className="print:hidden" />
        </div>
      ) : null}
      <ul className="mx-5 sm:mx-8 print:mx-0">
        {items.map((item, index) => (
          <li
            className="group grid grid-cols-[2rem_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 border-b border-border/80 py-3.5 sm:grid-cols-[2rem_minmax(0,1fr)_auto_10.75rem] sm:items-center print:grid-cols-[2rem_minmax(0,1fr)_auto]"
            key={item.id}
          >
            <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold tabular-nums text-secondary-foreground sm:mt-0 print:bg-transparent">
              {index + 1}
              <span className="sr-only">.</span>
            </span>
            <span className="min-w-0">
              <span className="block font-medium [overflow-wrap:anywhere]">
                {item.description}
              </span>
              <span className="block text-sm tabular-nums text-muted-foreground">
                <span className="sr-only print:not-sr-only">Quantity: </span>
                {item.quantity} ×{' '}
                <span className="sr-only print:not-sr-only">Unit price: </span>
                {dollars(item.cents)}
              </span>
            </span>
            <span className="text-right font-semibold tabular-nums">
              <span className="sr-only print:not-sr-only print:font-normal print:text-muted-foreground">
                Line total:{' '}
              </span>
              {dollars(item.quantity * item.cents)}
            </span>
            <span className="col-span-2 col-start-2 flex flex-wrap items-center justify-end gap-0.5 sm:col-span-1 sm:col-start-auto print:hidden">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Move up"
                disabled={editing !== null || index === 0}
                aria-label={'Move line ' + (index + 1) + ' up'}
                onClick={() => {
                  setItems(moveLineUp(items, item.id));
                  setMessage(
                    item.description + ' moved to line ' + index + '.',
                  );
                }}
              >
                <ArrowUpIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Move down"
                disabled={editing !== null || index === items.length - 1}
                aria-label={'Move line ' + (index + 1) + ' down'}
                onClick={() => {
                  setItems(moveLineDown(items, item.id));
                  setMessage(
                    item.description + ' moved to line ' + (index + 2) + '.',
                  );
                }}
              >
                <ArrowDownIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Duplicate line"
                disabled={editing !== null || items.length >= 100}
                aria-label={
                  'Duplicate line ' + (index + 1) + ': ' + item.description
                }
                onClick={() => {
                  setItems(duplicateLine(items, item.id));
                  setMessage('Line duplicated.');
                }}
              >
                <CopyIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Edit"
                aria-label={'Edit ' + item.description}
                onClick={() => {
                  if (
                    (description ||
                      price ||
                      quantity !== '1' ||
                      editing !== null) &&
                    !window.confirm('Discard the unfinished line item?')
                  )
                    return;
                  setMessage('Editing ' + item.description + '.');
                  setEditing(item.id);
                  setDescription(item.description);
                  setQuantity(String(item.quantity));
                  setPrice((item.cents / 100).toFixed(2));
                  descriptionRef.current?.focus();
                }}
              >
                <PencilIcon />
              </Button>
              <Button
                type="button"
                disabled={editing !== null}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                title="Remove"
                aria-label={'Remove ' + item.description}
                onClick={() => {
                  setItems(items.filter((row) => row.id !== item.id));
                  setMessage('Item removed.');
                  descriptionRef.current?.focus();
                }}
              >
                <TrashIcon />
              </Button>
            </span>
          </li>
        ))}
      </ul>
      {!items.length ? (
        <div className="mx-5 flex flex-col items-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center sm:mx-8 print:hidden">
          <TallyleafMark className="h-10 w-10 opacity-80" />
          <p className="font-medium">No items yet. Add your first line item.</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Type a description, quantity and unit price above — or pull in a
            saved service template.
          </p>
        </div>
      ) : null}
      <div className="grid gap-6 px-5 py-6 sm:px-8 md:grid-cols-[minmax(0,1fr)_19rem] print:px-0">
        <div className="space-y-5 print:hidden">
          <div>
            <label htmlFor="discount">Discount (%)</label>
            <div className="relative max-w-[8rem]">
              <Input
                className="pr-8 tabular-nums"
                id="discount"
                inputMode="numeric"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                aria-invalid={!validDiscount}
                aria-describedby="discount-help"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
              >
                %
              </span>
            </div>
            <p
              id="discount-help"
              className={
                'mt-1.5 text-xs ' +
                (validDiscount ? 'text-muted-foreground' : 'text-destructive')
              }
            >
              {validDiscount
                ? 'Whole percentages from 0 to 100.'
                : 'Enter a whole percentage from 0 to 100. Totals exclude the invalid discount.'}
            </p>
          </div>
          <div>
            <label htmlFor="notes">Quote notes</label>
            <Textarea
              id="notes"
              value={notes}
              maxLength={1000}
              rows={4}
              placeholder="Scope, timing, assumptions or payment terms"
              onChange={(e) => setNotes(e.target.value)}
            />
            <p className="mt-1.5 text-right text-xs tabular-nums text-muted-foreground">
              {notes.length}/1000
            </p>
          </div>
        </div>
        <div className="md:col-start-2">
          <div className="rounded-lg border bg-card p-5 shadow-soft print:border-0 print:p-0 print:shadow-none">
            <dl className="grid grid-cols-[1fr_auto] gap-y-2 text-sm tabular-nums">
              <dt className="pr-4 text-muted-foreground">Subtotal</dt>
              <dd className="text-right">{dollars(totals.subtotal)}</dd>
              <dt className="pr-4 text-muted-foreground">
                Discount{' '}
                <span className="hidden print:inline">
                  ({validDiscount ? discount : 0}%)
                </span>
              </dt>
              <dd className="text-right">{dollars(totals.saving)}</dd>
              <dt className="mt-2 border-t-2 border-foreground/80 pr-4 pt-3 font-display text-lg font-semibold">
                Total
              </dt>
              <dd className="mt-2 border-t-2 border-foreground/80 pt-3 text-right font-display text-2xl font-semibold text-primary print:text-foreground">
                {dollars(totals.total)}
              </dd>
            </dl>
            <div className="mt-5 grid gap-2 print:hidden">
              {onSave ? (
                <Button
                  type="button"
                  className="w-full gap-2"
                  disabled={
                    editing !== null ||
                    !normalizedQuoteName(name) ||
                    !validDiscount ||
                    !!description ||
                    !!price ||
                    quantity !== '1'
                  }
                  onClick={() =>
                    onSave({
                      ...initial,
                      name: normalizedQuoteName(name)!,
                      reference,
                      notes,
                      items,
                      discount: Number(discount),
                    })
                  }
                >
                  <SaveIcon />
                  Save draft
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                disabled={
                  editing !== null ||
                  !items.length ||
                  !validDiscount ||
                  !normalizedQuoteName(name) ||
                  !!description ||
                  !!price ||
                  quantity !== '1'
                }
                onClick={() => window.print()}
              >
                <PrinterIcon />
                Print quote
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground print:hidden">
              Finish or cancel the current line item before saving or printing.
              Save draft also saves changes to its name.
            </p>
          </div>
        </div>
      </div>
      {notes ? (
        <div className="hidden print:block">
          <h3 className="mt-4 font-semibold">Notes</h3>
          <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
            {notes}
          </p>
        </div>
      ) : null}
      <p className="mt-10 hidden border-t pt-3 text-xs text-muted-foreground print:block">
        Prepared with Tallyleaf
      </p>
    </div>
  );
}
