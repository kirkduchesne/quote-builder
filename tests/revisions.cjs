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
