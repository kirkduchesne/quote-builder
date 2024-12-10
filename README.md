# Quote Builder

A small project estimate worksheet.

Created in September 2026 as a present-day reconstruction with an initial September 2023 technology baseline and twelve dated maintenance milestones across 2024. Historical commit dates were intentionally assigned; they do not indicate original work or publication in 2023.

## Run

Use Node 20, then `npm ci` and `npm run dev`. Open `http://localhost:3000`. Run `npm test`, `npm run typecheck`, and `npm run build` for checks.

The reconstruction was tested with Node 20.19.0, a later maintenance release. That patch release is not represented as having existed at the January 2024 milestone. This historical dependency set is for local portfolio demonstration, not a recommendation for a current production deployment.

## Workflow

Add a description, a whole quantity from 1 to 999, and a USD unit price from 0 to 999999.99. Quotes support up to 100 line items. Remove unwanted rows and apply a whole percentage discount from 0 to 100. Prices are parsed into integer cents; the discount is rounded once to the nearest cent, with half-cent values rounded up.

Invalid discount input shows a message, leaves the displayed total undiscounted, and disables printing until corrected. Print uses the browser print dialog and omits editing controls. Save draft stores the named quote in this browser. Unsaved edits are not restored after reload. There are no accounts, payments, taxes, remote services, or saved customer records.

## Technology and component provenance

Initial baseline: Next.js 13.4.19 App Router, React 18.2.0, TypeScript 5.1.6, and Tailwind CSS 3.3.3. Exact dependencies and the lockfile were resolved with `npm install --before=2023-09-05T00:00:00Z --save-exact`.

The Button and Input components are copied from shadcn/ui revision [`c21ecfb665214e18cd5914ea319f925cd676e786`](https://github.com/shadcn-ui/ui/tree/c21ecfb665214e18cd5914ea319f925cd676e786), from before September 5, 2023:

- `apps/www/registry/default/ui/button.tsx` → `components/ui/button.tsx`
- `apps/www/registry/default/ui/input.tsx` → `components/ui/input.tsx`

Their original source is unchanged. The upstream MIT notice is included in `SHADCN-LICENSE.md`. The small `cn` helper and Tailwind theme supply their expected utilities and colors. No current component generator was used.

## Verification

Money tests cover integer parsing, rejected exponent/negative/excess-precision inputs, subtotal calculation, half-cent rounding, full discount, empty quotes, and invalid line items. Browser checks cover adding/removing rows, invalid discount and quantity input, literal text rendering, narrow layouts, keyboard activation, and print output.


## 2024 maintenance

The January 23 milestone updates to Next.js 14.0.4, TypeScript 5.3.3, Tailwind CSS 3.4.1, and Node 20. The November 7 milestone updates to Next.js 14.2.17 and React 18.3.1. Each dependency resolution used its milestone date as the npm `--before` cutoff; registry checks covered 131 January and 130 November locked versions. The original shadcn components and license remain unchanged.

Twelve maintenance commits are assigned January 23, February 19, March 28, April 11, May 28, June 13, July 25, August 15, September 12, October 24, November 7, and December 10, 2024. The implementation was actually created in September 2026, including these maintenance changes.

Save up to 20 drafts with names, references, notes, line items, and discounts. Change the quote name and select **Save draft** to rename it. Use **Edit** to load a line item into the form, then **Update item** or **Cancel edit**. Finish or cancel any incomplete line item before saving or printing. Draft deletion requires confirmation; switching or creating a quote prompts before discarding unsaved changes.

Storage is local to this browser. Invalid stored data is preserved; session changes cannot overwrite it. Storage failures are reported as session-only saves, and leaving the page prompts about changes not written to storage. Changes from another tab block writes until reload, avoiding silent overwrites. No account, network synchronization, or backup is provided. Clearing browser site data removes drafts. Do not store sensitive customer details in this local demonstration.

The validated version-one storage format is tested against malformed data, invalid values, duplicate identifiers, and size limits. Money regression cases include full-size quotes and half-cent discount rounding. Print includes the quote name, reference, notes, and calculated totals while hiding editing controls.
