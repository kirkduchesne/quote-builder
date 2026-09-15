const assert = require('node:assert/strict');
const revisions = require('../.test-build/revisions');
const { newDraft } = require('../.test-build/drafts');
const sample = { id: 'r1', label: 'Before discount', capturedAt: '2026-01-06T15:00:00.000Z', quote: newDraft('q1') };
assert.equal(revisions.validRevision(sample), true);
assert.equal(revisions.validRevision({ ...sample, capturedAt: '2026-02-30T15:00:00.000Z' }), false);
assert.equal(revisions.validRevision({ ...sample, label: ' ' }), false);
console.log('Revision records passed');
assert.deepEqual(revisions.parseRevisions(JSON.stringify({ version: 1, revisions: [sample] })), [sample]);
assert.throws(() => revisions.parseRevisions(JSON.stringify({ version: 1, revisions: [sample, sample] })));
assert.throws(() => revisions.parseRevisions(JSON.stringify({ version: 2, revisions: [] })));
for (const raw of ['', 'null', '{}', '{', JSON.stringify({ version: 1, revisions: [null] })]) {
  assert.throws(() => revisions.parseRevisions(raw));
}
for (const change of [{ id: '' }, { label: 'a'.repeat(81) }, { quote: { ...sample.quote, discount: 101 } }, { capturedAt: 'yesterday' }]) {
  assert.throws(() => revisions.parseRevisions(JSON.stringify({ version: 1, revisions: [{ ...sample, ...change }] })));
}
assert.throws(() => revisions.parseRevisions(JSON.stringify({ version: 1, revisions: Array.from({ length: 41 }, (_, i) => ({ ...sample, id: `r${i}`, quote: newDraft(`q${i}`) })) })));
assert.throws(() => revisions.parseRevisions(JSON.stringify({ version: 1, revisions: Array.from({ length: 6 }, (_, i) => ({ ...sample, id: `r${i}` })) })));

const original = { ...newDraft('q2'), items: [{ id: 1, description: 'Design', quantity: 2, cents: 501 }] };
const copy = revisions.snapshotQuote(original, 'r2', sample.capturedAt);
original.items[0].cents = 800;
assert.equal(copy.quote.items[0].cents, 501);
assert.throws(() => revisions.snapshotQuote(original, '', sample.capturedAt));

assert.equal(revisions.sameQuoteContents(original, copy.quote), false);
assert.equal(revisions.sameQuoteContents(copy.quote, JSON.parse(JSON.stringify(copy.quote))), true);
assert.equal(revisions.latestRevision([sample, copy], 'q1'), sample);

const five = Array.from({ length: 5 }, (_, i) => ({ ...sample, id: `keep${i}` }));
assert.deepEqual(revisions.retainSourceRevisions(five, { ...sample, id: 'latest' }).map(r => r.id), ['keep1', 'keep2', 'keep3', 'keep4', 'latest']);
assert.equal(five.length, 5);

assert.throws(() => revisions.captureRevision([sample], sample.quote, 'other', sample.capturedAt), /already matches/);
const full = Array.from({ length: 40 }, (_, i) => ({ ...sample, id: `full${i}`, quote: newDraft(`source${i}`) }));
assert.throws(() => revisions.captureRevision(full, newDraft('new'), 'new', sample.capturedAt), /full/);
assert.equal(revisions.captureRevision(five, { ...sample.quote, notes: 'changed' }, 'new', sample.capturedAt).length, 5);

assert.equal(revisions.renameRevision([sample], 'r1', '  First  ')[0].label, 'First');
assert.equal(sample.label, 'Before discount');
assert.throws(() => revisions.renameRevision([sample], 'missing', 'Label'));
assert.throws(() => revisions.renameRevision([sample], 'r1', ' '));

assert.deepEqual(revisions.deleteRevision([sample], 'r1'), []);
assert.throws(() => revisions.deleteRevision([], 'r1'));

const recovered = revisions.restoredDraft({ ...copy.quote, id: 'restored-1' }, [], ['restored-1', 'restored-2']);
assert.equal(recovered.id, 'restored-3');
assert.notEqual(recovered.items[0], copy.quote.items[0]);

const { calculateTotal } = require('../.test-build/money');
for (const discount of [0, 1, 50, 99, 100]) {
  const quote = { ...newDraft('money'), discount, items: [{ id: 1, description: 'Boundary', quantity: 999, cents: 99999999 }, { id: 2, description: 'Rounding', quantity: 1, cents: 1 }] };
  const captured = revisions.snapshotQuote(quote, 'money', sample.capturedAt);
  const parsed = revisions.parseRevisions(JSON.stringify({ version: 1, revisions: [captured] }))[0];
  assert.deepEqual(calculateTotal(parsed.quote.items, parsed.quote.discount), calculateTotal(quote.items, quote.discount));
}

const restored = revisions.restoredDraft(copy.quote, [], [copy.quote.id]);
restored.items[0].description = 'Changed restored copy'; restored.notes = 'New notes';
assert.equal(copy.quote.items[0].description, 'Design'); assert.equal(copy.quote.notes, '');
assert.throws(() => revisions.restoredDraft(copy.quote, Array.from({ length: 20 }, (_, i) => newDraft(String(i))), []));
const recaptured = revisions.captureRevision([copy], restored, 'restored-snapshot', sample.capturedAt);
assert.equal(recaptured[0].quote.items[0].description, 'Design');
assert.equal(recaptured[1].quote.items[0].description, 'Changed restored copy');

let history = [];
for (let source = 0; source < 8; source++) {
  for (let version = 0; version < 5; version++) history = revisions.captureRevision(history, { ...newDraft('source' + source), notes: String(version) }, `group${source}-${version}`, sample.capturedAt);
}
assert.equal(history.length, 40);
const next = revisions.captureRevision(history, { ...newDraft('source0'), notes: 'newest' }, 'replacement', sample.capturedAt);
assert.equal(next.length, 40); assert(!next.some(r => r.id === 'group0-0'));
assert.equal(next.filter(r => r.quote.id === 'source1').length, 5);
assert.throws(() => revisions.captureRevision(history, newDraft('source9'), 'overflow', sample.capturedAt));
assert.equal(history[0].id, 'group0-0');

const { duplicateDraft } = require('../.test-build/quote-operations');
const { mergeBackup } = require('../.test-build/backups');
const { unusedDraftId } = require('../.test-build/drafts');
assert.equal(duplicateDraft([], newDraft('original'), ['copy-1']).id, 'copy-2');
assert.equal(unusedDraftId([], ['quote-1']), 'quote-2');
assert.notEqual(mergeBackup([], [newDraft('copy-1')], ['copy-1'])[0].id, 'copy-1');
