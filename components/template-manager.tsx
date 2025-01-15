"use client";
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parseCents, dollars } from '@/lib/money';
import { createTemplate, updateTemplate, deleteTemplate, searchTemplates, type Template } from '@/lib/templates';
import { loadTemplates, saveTemplates } from '@/lib/template-storage';
export function TemplateManager({ onInsert }: { onInsert: (template: Template) => void }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [ready,setReady] = useState(false);
  const [message,setMessage] = useState('');
  const raw = useRef<string | null>(null);
  const readable = useRef(false);
  useEffect(() => { const loaded=loadTemplates({getItem:key=>localStorage.getItem(key)}); setTemplates(loaded.templates); raw.current=loaded.raw; readable.current=loaded.readable; if(!loaded.readable)setMessage('Saved templates could not be read. Changes will be session-only and leave saved data untouched.'); setReady(true); },[]);
  const [name,setName]=useState(''); const [description,setDescription]=useState(''); const [quantity,setQuantity]=useState('1'); const [price,setPrice]=useState(''); const [editing,setEditing]=useState<number|null>(null);
  const [pending,setPending]=useState(false);
  useEffect(()=>{function warn(e:BeforeUnloadEvent){if(pending || name || description || price){e.preventDefault();e.returnValue='';}}window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[pending,name,description,price]);
  function persist(next:Template[]) { setTemplates(next); try { if(!readable.current)throw Error('Unreadable saved templates are protected.'); raw.current=saveTemplates(localStorage,next,raw.current); setPending(false);setMessage('Service templates saved.'); } catch(error){setPending(true);setMessage((error as Error).message+' Changes are session-only.');} }
  function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const cents=parseCents(price);try{if(cents===null)throw Error('Enter a price with at most two decimals.');const fields={name:name.trim(),description:description.trim(),quantity:Number(quantity),cents};persist(editing===null?createTemplate(templates,fields):updateTemplate(templates,{...fields,id:editing}));setName('');setDescription('');setQuantity('1');setPrice('');setEditing(null);}catch(error){setMessage((error as Error).message);}}
  return <section aria-labelledby="templates-title" className="mb-6 rounded border p-4 print:hidden"><h2 id="templates-title" className="text-lg font-semibold">Service templates</h2><form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-2"><div><label htmlFor="template-name">Template name</label><Input id="template-name" value={name} maxLength={80} onChange={e=>setName(e.target.value)} required /></div><div><label htmlFor="template-description">Template description</label><Input id="template-description" value={description} maxLength={120} onChange={e=>setDescription(e.target.value)} required /></div><div><label htmlFor="template-quantity">Template quantity</label><Input id="template-quantity" inputMode="numeric" value={quantity} onChange={e=>setQuantity(e.target.value)} required /></div><div><label htmlFor="template-price">Template unit price (USD)</label><Input id="template-price" inputMode="decimal" value={price} onChange={e=>setPrice(e.target.value)} required /></div><Button disabled={!ready} type="submit">Save template</Button></form><p role="status">{ready ? message : 'Loading templates…'}</p><ul>{templates.map(template=><li className="mt-3 border-t pt-3" key={template.id}><strong>{template.name}</strong><p>{template.description} · {template.quantity} × {dollars(template.cents)}</p></li>)}</ul>{!templates.length?<p>No service templates yet.</p>:null}</section>;
}
