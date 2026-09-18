const assert = require('node:assert/strict');
const storage = require('../.test-build/revision-storage');
assert.deepEqual(storage.loadRevisions({ getItem: () => null }), {
  revisions: [],
  raw: null,
  readable: true,
});
assert.equal(storage.loadRevisions({ getItem: () => '' }).readable, false);
assert.equal(
  storage.loadRevisions({
    getItem: () => {
      throw new Error('blocked');
    },
  }).readable,
  false,
);

let raw = null;
const store = {
  getItem: () => raw,
  setItem: (_key, value) => {
    raw = value;
  },
};
assert.equal(storage.saveRevisions(store, [], null), raw);
assert.throws(() => storage.saveRevisions(store, [], null), /another tab/);

const intact = raw;
assert.throws(
  () =>
    storage.saveRevisions(
      {
        getItem: () => intact,
        setItem: () => {
          throw new Error('quota');
        },
      },
      [],
      intact,
    ),
  /quota/,
);
assert.equal(raw, intact);
assert.throws(() =>
  storage.saveRevisions(
    {
      getItem: () => 'corrupt',
      setItem: () => assert.fail('overwrote corruption'),
    },
    [],
    null,
  ),
);
assert.throws(() => storage.saveRevisions(store, [{ id: 'invalid' }], raw));
console.log('Revision storage failure boundaries passed');
