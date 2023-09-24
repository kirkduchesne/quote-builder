'use client';

import { useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { calculateTotal, dollars, parseCents } from '@/lib/money';

type Item = { id: number; description: string; quantity: number; cents: number };

export function QuoteForm() {
  const [items, setItems] = useState<Item[]>([]);
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');
  const [discount, setDiscount] = useState('0');
  const validDiscount = /^\d{1,3}$/.test(discount) && Number(discount) <= 100;
  const totals = calculateTotal(items, validDiscount ? Number(discount) : 0);
  const nextId = useRef(1);
  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cents = parseCents(price);
    if (!description.trim() || description.trim().length > 120 || !/^\d{1,3}$/.test(quantity) || Number(quantity) < 1 || cents === null) {
      setMessage('Enter a description, quantity from 1 to 999, and price from 0 to 999999.99 with at most two decimals.');
      return;
    }
    setItems([...items, { id: nextId.current++, description: description.trim(), quantity: Number(quantity), cents }]);
    setDescription(''); setQuantity('1'); setPrice(''); setMessage('Item added.');
  }
  return <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8 print:border-0 print:shadow-none">
    <form className="grid gap-4 sm:grid-cols-3 print:hidden" onSubmit={addItem}>
      <div><label htmlFor="description">Description</label><Input id="description" value={description} onChange={e => setDescription(e.target.value)} maxLength={120} required /></div>
      <div><label htmlFor="quantity">Quantity</label><Input id="quantity" inputMode="numeric" value={quantity} onChange={e => setQuantity(e.target.value)} required /></div>
      <div><label htmlFor="price">Unit price (USD)</label><Input id="price" inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} required /></div>
      <Button type="submit">Add item</Button>
    </form>
    <p role="status" className="print:hidden">{message}</p>
    <ul className="my-6 space-y-3">{items.map(item => <li className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 py-3 break-words" key={item.id}>{item.description} · {item.quantity} × {dollars(item.cents)} <Button type="button" variant="ghost" className="print:hidden" aria-label={"Remove " + item.description} onClick={() => { setItems(items.filter(row => row.id !== item.id)); setMessage("Item removed."); }}>Remove</Button></li>)}</ul>
    <div className="print:hidden"><label htmlFor="discount">Discount (%)</label><Input className="max-w-32" id="discount" inputMode="numeric" value={discount} onChange={e => setDiscount(e.target.value)} aria-invalid={!validDiscount} aria-describedby="discount-help" /><p id="discount-help">{validDiscount ? 'Whole percentages from 0 to 100.' : 'Enter a whole percentage from 0 to 100. Totals exclude the invalid discount.'}</p></div>
    <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-stone-200 pt-4 text-lg"><dt>Subtotal</dt><dd>{dollars(totals.subtotal)}</dd><dt>Discount</dt><dd>{dollars(totals.saving)}</dd><dt>Total</dt><dd>{dollars(totals.total)}</dd></dl>
    <Button type="button" className="mt-4 print:hidden" disabled={!items.length || !validDiscount} onClick={() => window.print()}>Print quote</Button>
    {!items.length ? <p>No items yet. Add your first line item.</p> : null}
  </div>;
}
