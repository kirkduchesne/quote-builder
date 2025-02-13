export type Item = {
  id: number;
  description: string;
  quantity: number;
  cents: number;
};
export type Draft = {
  id: string;
  name: string;
  reference: string;
  notes: string;
  items: Item[];
  discount: number;
};
export function newDraft(id: string): Draft {
  return {
    id,
    name: "Untitled quote",
    reference: "",
    notes: "",
    items: [],
    discount: 0,
  };
}
export function validDraft(value: unknown): value is Draft {
  if (!value || typeof value !== "object") return false;
  const d = value as Draft;
  return (
    typeof d.id === "string" &&
    d.id.length > 0 &&
    d.id.length <= 100 &&
    typeof d.name === "string" &&
    d.name.trim().length > 0 &&
    d.name.length <= 80 &&
    typeof d.reference === "string" &&
    d.reference.length <= 80 &&
    typeof d.notes === "string" &&
    d.notes.length <= 1000 &&
    Number.isInteger(d.discount) &&
    d.discount >= 0 &&
    d.discount <= 100 &&
    Array.isArray(d.items) &&
    d.items.length <= 100 &&
    d.items.every(
      (i) =>
        i &&
        Number.isSafeInteger(i.id) &&
        i.id > 0 &&
        i.id < Number.MAX_SAFE_INTEGER &&
        typeof i.description === "string" &&
        i.description.trim().length > 0 &&
        i.description.length <= 120 &&
        Number.isInteger(i.quantity) &&
        i.quantity >= 1 &&
        i.quantity <= 999 &&
        Number.isInteger(i.cents) &&
        i.cents >= 0 &&
        i.cents <= 99999999,
    ) &&
    new Set(d.items.map((i) => i.id)).size === d.items.length
  );
}
export function parseDrafts(raw: string): Draft[] {
  const value = JSON.parse(raw);
  if (
    !value ||
    value.version !== 1 ||
    !Array.isArray(value.drafts) ||
    value.drafts.length > 20 ||
    !value.drafts.every(validDraft) ||
    new Set(value.drafts.map((d: Draft) => d.id)).size !== value.drafts.length
  )
    throw new Error("Invalid saved drafts");
  return value.drafts;
}

export function unusedItemId(items: Item[]): number {
  const used = new Set(items.map(item => item.id));
  let id = 1;
  while (used.has(id)) id += 1;
  return id;
}

export function normalizedQuoteName(value: string): string | null {
  const name=value.trim(); return name.length>0 && name.length<=80 ? name : null;
}
