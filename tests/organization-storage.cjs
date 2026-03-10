const assert = require('node:assert/strict');
const storage = require('../.test-build/organization-storage');
assert.equal(storage.loadOrganization({ getItem: () => '{' }).readable, false);
let raw = null;
const store = { getItem: () => raw, setItem: (_key, value) => { raw = value; } };
assert.equal(storage.saveOrganization(store, { archivedIds: ['one'] }, null), raw);
assert.throws(() => storage.saveOrganization(store, { archivedIds: [] }, null), /another tab/);
assert.throws(() => storage.saveOrganization({ getItem: () => null, setItem: () => { throw new Error('quota'); } }, { archivedIds: [] }, null), /quota/);
