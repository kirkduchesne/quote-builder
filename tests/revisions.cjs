const assert = require('node:assert/strict');
const revisions = require('../.test-build/revisions');
const { newDraft } = require('../.test-build/drafts');
const sample = { id: 'r1', label: 'Before discount', capturedAt: '2026-01-06T15:00:00.000Z', quote: newDraft('q1') };
assert.equal(revisions.validRevision(sample), true);
assert.equal(revisions.validRevision({ ...sample, capturedAt: '2026-02-30T15:00:00.000Z' }), false);
assert.equal(revisions.validRevision({ ...sample, label: ' ' }), false);
console.log('Revision records passed');
