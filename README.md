# Quote Builder

A local quote worksheet for turning repeatable services into clear, printable estimates. Build line items, reuse service templates, keep named drafts, and move saved quotes between browsers with validated JSON backups.

![Quote Builder with an example estimate](docs/preview.png)

## Run

Use Node 20, then:

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. For a production build, run `npm run build` followed by `npm start`.

## Features

- Capture saved revisions, rename labels, export individual snapshots, and restore independent drafts, even after deleting the source quote.
- Create, edit, duplicate, reorder, and remove quote lines with USD prices calculated in integer cents.
- Apply a whole-number discount from 0–100%; rounding happens once at the discount total.
- Create up to 30 reusable service templates; search, edit, delete, and insert them into quotes.
- Name, reference, search, sort, duplicate, and save up to 20 drafts. Archive drafts to organize active work, filter archive status, or unarchive them without changing their contents.
- Export saved drafts and import validated backups without replacing existing quotes. Identifier and name collisions receive new values.
- Print the quote name, reference, ordered lines, discount, totals, and notes. Editing controls stay off the printout.

Finish a line with **Add item** or **Update item**, or use **Cancel line** / Escape before saving. Changing a quote name and saving renames the draft. Switching quotes asks before discarding unfinished quote edits. Template edits remain available when switching quotes.

## Storage and limits

Everything stays in this browser's local storage; there are no accounts, network synchronization, payment processing, or tax services. Reloading discards edits that have not been saved. Clearing site data removes saved drafts and templates. Avoid storing sensitive customer information.

Malformed saved data is left untouched. Failed writes are reported as session-only changes. Conflicting writes from another tab are rejected instead of silently overwriting its data. Keep the page open if saving fails; exporting saved drafts also includes drafts held only in the current session.

Draft backups contain all saved quotes, including archived quotes, their lines and notes. Archive flags are browser-only metadata in a separate storage key; they are not portable. Deleted drafts are removed from that metadata, while independent captured revisions remain available. They exclude service templates and unfinished edits. Imports require confirmation, accept files up to 5 MB, and enforce the combined 20-draft limit. Service templates have a separate, validated JSON backup format (512 KB, 30 templates after merging). Imports assign unused identifiers and distinguish duplicate names, retain unfinished template edits, and serialize file reads. Export templates separately; quote backups do not contain them.

Revision history holds five snapshots per source quote and forty overall. Capturing a sixth replaces only that quote’s oldest snapshot; a full shared history requires explicit deletion. Captures use the saved quote, excluding unfinished edits. Revision labels and snapshots stay in a separate local storage collection.

Each quote permits 100 lines, whole quantities from 1–999, and unit prices from $0–$999,999.99. Notes are limited to 1,000 characters. This remains a small estimate worksheet, not an invoicing or accounting system.

## Verification

```sh
npm test
npm run typecheck
npm run build
```

The domain tests cover money boundaries, template and draft schemas, duplicate identifiers, line operations, backup roundtrips, import limits, and stale-storage protection. CI runs the tests and production build with pinned actions and Node 20.18.1.

The four browser suites—`tests/browser-regressions.cjs`, `tests/templates-browser.cjs`, `tests/backups-browser.cjs`, and `tests/worksheet-browser.cjs`—use an externally supplied Playwright runtime and a running app (`QUOTE_TEST_URL`, default `http://localhost:8504` for all four). They verify template insertion, retained template edits, failed storage writes, backup download/import/cancellation, keyboard controls, mobile overflow, and print output. The screenshot uses clearly labeled example data. Local verification used Node 20.19.0, a later maintenance patch, rather than claiming it existed at the January milestone.

## Project history and technology

This is a present-day reconstruction created in **September 2026**. Historical commit dates were intentionally assigned and do not represent original work or publication in those years.

- **2023:** one-page line items, integer-cent totals, discounts, and printing.
- **2024:** saved drafts, quote references and notes, line editing, and storage safeguards.
- **January–February 2025:** service templates, quote organization, portable draft backups, and keyboard/print refinements.

The 2025 baseline uses Next.js 14.2.22, React 18.3.1, TypeScript 5.3.3, and Tailwind CSS 3.4.1. The January framework update was resolved with a January 7, 2025 cutoff; all 130 locked package versions were checked against publication dates. These historical dependencies have known advisories and are intended for local portfolio demonstration, not current production deployment.

Button and Input retain their original shadcn/ui source from revision [`c21ecfb665214e18cd5914ea319f925cd676e786`](https://github.com/shadcn-ui/ui/tree/c21ecfb665214e18cd5914ea319f925cd676e786), under `apps/www/registry/default/ui/`. The upstream MIT license is preserved in [SHADCN-LICENSE.md](SHADCN-LICENSE.md).
