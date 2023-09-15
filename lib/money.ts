export function parseCents(value: string): number | null {
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}
export function dollars(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export function calculateTotal(items: { quantity: number; cents: number }[], discount: number) {
  if (!Number.isInteger(discount) || discount < 0 || discount > 100) throw new Error('Discount must be 0–100.');
  const subtotal = items.reduce((sum, item) => {
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999 || !Number.isInteger(item.cents) || item.cents < 0 || item.cents > 99999999) throw new Error('Invalid line item.');
    return sum + item.quantity * item.cents;
  }, 0);
  if (!Number.isSafeInteger(subtotal) || !Number.isSafeInteger(subtotal * 100)) throw new Error('Quote is too large.');
  const saving = Math.round(subtotal * discount / 100);
  return { subtotal, saving, total: subtotal - saving };
}
