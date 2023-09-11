'use client';

import { useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dollars, parseCents } from '@/lib/money';

type Item = { id: number; description: string; quantity: number; cents: number };

export function QuoteForm() {
  const [items, setItems] = useState<Item[]>([]);
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');
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
  return <div>
    <form onSubmit={addItem} className="space-y-4">
      <div><label htmlFor="description">Description</label><Input id="description" value={description} onChange={e => setDescription(e.target.value)} maxLength={120} required /></div>
      <div><label htmlFor="quantity">Quantity</label><Input id="quantity" inputMode="numeric" value={quantity} onChange={e => setQuantity(e.target.value)} required /></div>
      <div><label htmlFor="price">Unit price (USD)</label><Input id="price" inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} required /></div>
      <Button type="submit">Add item</Button>
    </form>
    <p role="status">{message}</p>
    <ul>{items.map(item => <li key={item.id}>{item.description} · {item.quantity} × {dollars(item.cents)}</li>)}</ul>
    {!items.length ? <p>No items yet. Add your first line item.</p> : null}
  </div>;
}
