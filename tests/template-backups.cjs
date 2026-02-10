const assert = require('node:assert/strict');
const backups = require('../.test-build/template-backups');
const template = { id: 1, name: 'Review', description: 'Sample review', quantity: 1, cents: 1500 };
const envelope = templates => JSON.stringify({ kind: 'quote-builder-templates', version: 1, templates });
assert.deepEqual(backups.parseTemplateBackup(envelope([template])), [template]);
assert.throws(() => backups.parseTemplateBackup(JSON.stringify({ kind: 'quote-builder', version: 1, drafts: [] })));
assert.throws(() => backups.parseTemplateBackup(envelope([template, template])));
assert.throws(() => backups.parseTemplateBackup(' '.repeat(512001)));
