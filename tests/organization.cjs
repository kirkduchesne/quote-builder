const assert = require('node:assert/strict');
const organization = require('../.test-build/organization');
const { newDraft } = require('../.test-build/drafts');
assert.equal(organization.validOrganization({ archivedIds: ['one'] }), true);
assert.equal(organization.validOrganization({ archivedIds: ['one', 'one'] }), false);
assert.equal(organization.validOrganization({ archivedIds: [''] }), false);
assert.equal(organization.validOrganization({ archivedIds: Array.from({ length: 21 }, (_, i) => String(i)) }), false);

assert.deepEqual(organization.parseOrganization('{"version":1,"archivedIds":["one"]}'), { archivedIds: ['one'] });
for (const raw of ['', 'null', '{"version":2,"archivedIds":[]}', '{"version":1,"archivedIds":[null]}']) assert.throws(() => organization.parseOrganization(raw));

const original = { archivedIds: ['one'] };
assert.deepEqual(organization.setArchived(original, 'two', true), { archivedIds: ['one', 'two'] });
assert.deepEqual(organization.setArchived(original, 'one', false), { archivedIds: [] });
assert.deepEqual(original, { archivedIds: ['one'] });
