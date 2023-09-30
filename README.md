# Quote Builder

A small project estimate worksheet.

Created in September 2026 as a present-day reconstruction using technology available in September 2023. Historical commit dates were intentionally assigned; they do not indicate original work or publication in 2023.

## Run

Use Node 18, then `npm ci` and `npm run dev`. Open `http://localhost:3000`. Run `npm test`, `npm run typecheck`, and `npm run build` for checks.

The reconstruction was tested with Node 18.20.5, a later maintenance release. That patch release is not represented as having existed in September 2023. This historical dependency set is for local portfolio demonstration, not a recommendation for a current production deployment.

## Workflow

Add a description, a whole quantity from 1 to 999, and a USD unit price from 0 to 999999.99. Quotes support up to 100 line items. Remove unwanted rows and apply a whole percentage discount from 0 to 100. Prices are parsed into integer cents; the discount is rounded once to the nearest cent, with half-cent values rounded up.

Invalid discount input shows a message, leaves the displayed total undiscounted, and disables printing until corrected. Print uses the browser print dialog and omits editing controls. Quotes exist only in the open page: reloading clears the worksheet. There are no accounts, payments, taxes, remote services, or saved customer records.

## Technology and component provenance

Next.js 13.4.19 App Router, React 18.2.0, TypeScript 5.1.6, and Tailwind CSS 3.3.3. Exact dependencies and the lockfile were resolved with `npm install --before=2023-09-05T00:00:00Z --save-exact`.

The Button and Input components are copied from shadcn/ui revision [`c21ecfb665214e18cd5914ea319f925cd676e786`](https://github.com/shadcn-ui/ui/tree/c21ecfb665214e18cd5914ea319f925cd676e786), from before September 5, 2023:

- `apps/www/registry/default/ui/button.tsx` → `components/ui/button.tsx`
- `apps/www/registry/default/ui/input.tsx` → `components/ui/input.tsx`

Their original source is unchanged. The upstream MIT notice is included in `SHADCN-LICENSE.md`. The small `cn` helper and Tailwind theme supply their expected utilities and colors. No current component generator was used.

## Verification

Money tests cover integer parsing, rejected exponent/negative/excess-precision inputs, subtotal calculation, half-cent rounding, full discount, empty quotes, and invalid line items. Browser checks cover adding/removing rows, invalid discount and quantity input, literal text rendering, narrow layouts, keyboard activation, and print output.
