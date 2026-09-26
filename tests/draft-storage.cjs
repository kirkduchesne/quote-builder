const assert = require('node:assert/strict');
const { writeDrafts } = require('../.test-build/draft-storage.js');
let raw = 'outside';
const store = {
  getItem: () => raw,
  setItem: (k, v) => {
    raw = v;
  },
};
assert.throws(() => writeDrafts(store, 'key', [], null));
assert.equal(raw, 'outside');
raw = null;
assert.equal(writeDrafts(store, 'key', [], null), '{"version":1,"drafts":[]}');
