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
  return <section aria-labelledby="templates-title" className="mb-6 rounded border p-4 print:hidden"><h2 id="templates-title" className="text-lg font-semibold">Service templates</h2><p role="status">{ready ? message : 'Loading templates…'}</p></section>;
}
