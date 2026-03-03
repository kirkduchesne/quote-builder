const assert = require('node:assert/strict');
const organization = require('../.test-build/organization');
const { newDraft } = require('../.test-build/drafts');
assert.equal(organization.validOrganization({ archivedIds: ['one'] }), true);
assert.equal(organization.validOrganization({ archivedIds: ['one', 'one'] }), false);
assert.equal(organization.validOrganization({ archivedIds: [''] }), false);
assert.equal(organization.validOrganization({ archivedIds: Array.from({ length: 21 }, (_, i) => String(i)) }), false);
