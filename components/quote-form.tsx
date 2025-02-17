"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateTotal, dollars, parseCents } from "@/lib/money";

import { type Draft, type Item, newDraft, unusedItemId, normalizedQuoteName } from "@/lib/drafts";
import { TemplateManager } from "@/components/template-manager";
import { templateItem } from "@/lib/templates";
import { duplicateLine, moveLineUp, moveLineDown } from "@/lib/quote-operations";
const blank = newDraft("unsaved");

export function QuoteForm({
  initial = blank,
  onSave,
  onDirty,
}: {
  initial?: Draft;
  onSave?: (draft: Draft) => void;
  onDirty?: (dirty: boolean) => void;
}) {
  const [items, setItems] = useState<Item[]>(initial.items);
  const [editing, setEditing] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [discount, setDiscount] = useState(String(initial.discount));
  const validDiscount = /^\d{1,3}$/.test(discount) && Number(discount) <= 100;
  const totals = calculateTotal(items, validDiscount ? Number(discount) : 0);
  const [name, setName] = useState(initial.name);
  const [reference, setReference] = useState(initial.reference);
  const [notes, setNotes] = useState(initial.notes);
  useEffect(() => {
    setItems(initial.items); setName(initial.name); setReference(initial.reference); setNotes(initial.notes); setDiscount(String(initial.discount)); setEditing(null); setDescription(''); setQuantity('1'); setPrice(''); setMessage('');
  }, [initial.id]);
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
        quantity !== "1",
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
      setMessage("A quote can contain at most 100 line items.");
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
        "Enter a description, quantity from 1 to 999, and price from 0 to 999999.99 with at most two decimals.",
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
    setDescription("");
    setQuantity("1");
    setPrice("");
    setMessage("Item added.");
  }
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8 print:border-0 print:shadow-none">
      <div className="mb-6 grid gap-4 sm:grid-cols-2 print:hidden">
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
            onChange={(e) => setReference(e.target.value)}
          />
        </div>
      </div>
      <h2 className="hidden break-words text-2xl print:block">{name}</h2>
      <p className="hidden break-words print:block">{reference}</p>
      {(description || price || editing !== null) ? <p className="print:hidden">Using a service template will ask before replacing the unfinished line editor.</p> : null}
      <TemplateManager onInsert={template=>{if((description || price || quantity !== '1' || editing !== null) && !window.confirm('Discard the unfinished line item before using this template?'))return;try{setItems([...items,templateItem(template,items)]);setEditing(null);setDescription('');setPrice('');setQuantity('1');setMessage('Service template added.');}catch(error){setMessage((error as Error).message);}}} />
      {(editing !== null || description || price || quantity !== '1') ? <p role="status" className="print:hidden">A line is unfinished. Add or update it, or choose Cancel line before saving the draft.</p> : null}
      <form
        className="grid gap-4 sm:grid-cols-3 print:hidden"
        onSubmit={addItem}
        onKeyDown={event=>{if(event.key==='Escape' && (editing!==null || description || price || quantity!=='1')){event.preventDefault();setEditing(null);setDescription('');setQuantity('1');setPrice('');setMessage('Line editor cleared.');descriptionRef.current?.focus();}}}
      >
        <div>
          <label htmlFor="description">Description</label>
          <Input
            ref={descriptionRef}
            id="description"
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
            inputMode="numeric"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="price">Unit price (USD)</label>
          <Input
            id="price"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <Button type="submit">
          {editing === null ? "Add item" : "Update item"}
        </Button>
        {(editing !== null || description || price || quantity !== "1") ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setEditing(null);
              setDescription("");
              setQuantity("1");
              setPrice("");
            }}
          >
            Cancel line
          </Button>
        ) : null}
      </form>
      <p role="status" className="print:hidden">
        {message}
      </p>
      <ul className="my-6 space-y-3">
        {items.map((item, index) => (
          <li
            className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 py-3 break-words"
            key={item.id}
          >
            <span className="min-w-0 break-all">
              <span className="mr-2 text-sm">{index + 1}.</span>{item.description} · {item.quantity} × {dollars(item.cents)} ={" "}
              {dollars(item.quantity * item.cents)}
            </span>{" "}
            <Button type="button" variant="ghost" className="print:hidden" disabled={editing !== null || index === 0} onClick={()=>{setItems(moveLineUp(items,item.id));setMessage(item.description+' moved to line '+index+'.');}}>Move up</Button>
            <Button type="button" variant="ghost" className="print:hidden" disabled={editing !== null || index === items.length-1} onClick={()=>{setItems(moveLineDown(items,item.id));setMessage(item.description+' moved to line '+(index+2)+'.');}}>Move down</Button>
            <Button type="button" variant="outline" className="print:hidden" disabled={editing !== null || items.length >= 100} onClick={()=>{setItems(duplicateLine(items,item.id));setMessage('Line duplicated.');}}>Duplicate line</Button>
            <Button
              type="button"
              variant="outline"
              className="print:hidden"
              aria-label={"Edit " + item.description}
              onClick={() => {
                if (
                  (description || price) &&
                  !window.confirm("Discard the unfinished line item?")
                )
                  return;
                setMessage('Editing '+item.description+'.');
                setEditing(item.id);
                setDescription(item.description);
                setQuantity(String(item.quantity));
                setPrice((item.cents / 100).toFixed(2));
                descriptionRef.current?.focus();
              }}
            >
              Edit
            </Button>
            <Button
              type="button"
              disabled={editing !== null}
              variant="ghost"
              className="print:hidden"
              aria-label={"Remove " + item.description}
              onClick={() => {
                setItems(items.filter((row) => row.id !== item.id));
                setMessage("Item removed.");
                descriptionRef.current?.focus();
              }}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
      <div className="print:hidden">
        <label htmlFor="discount">Discount (%)</label>
        <Input
          className="max-w-[8rem]"
          id="discount"
          inputMode="numeric"
          value={discount}
          onChange={(e) => setDiscount(e.target.value)}
          aria-invalid={!validDiscount}
          aria-describedby="discount-help"
        />
        <p id="discount-help">
          {validDiscount
            ? "Whole percentages from 0 to 100."
            : "Enter a whole percentage from 0 to 100. Totals exclude the invalid discount."}
        </p>
      </div>
      <div className="mt-5 print:hidden">
        <label htmlFor="notes">Quote notes</label>
        <textarea
          id="notes"
          className="w-full rounded border border-input p-3"
          value={notes}
          maxLength={1000}
          rows={3}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      {notes ? (
        <p className="hidden whitespace-pre-wrap break-words print:block">
          {notes}
        </p>
      ) : null}
      <p className="mt-4 text-sm print:hidden">
        Finish or cancel the current line item before saving or printing. Save
        draft also saves changes to its name.
      </p>
      <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-stone-200 pt-4 text-lg">
        <dt>Subtotal</dt>
        <dd>{dollars(totals.subtotal)}</dd>
        <dt>Discount</dt>
        <dd>{dollars(totals.saving)}</dd>
        <dt>Total</dt>
        <dd>{dollars(totals.total)}</dd>
      </dl>
      {onSave ? (
        <Button
          type="button"
          className="mt-4 mr-3 print:hidden"
          disabled={
            editing !== null ||
            !normalizedQuoteName(name) ||
            !validDiscount ||
            !!description ||
            !!price ||
            quantity !== "1"
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
          Save draft
        </Button>
      ) : null}
      <Button
        type="button"
        className="mt-4 print:hidden"
        disabled={
          editing !== null ||
          !items.length ||
          !validDiscount ||
          !normalizedQuoteName(name) ||
          !!description ||
          !!price ||
          quantity !== "1"
        }
        onClick={() => window.print()}
      >
        Print quote
      </Button>
      {!items.length ? <p>No items yet. Add your first line item.</p> : null}
    </div>
  );
}
