const assert = require('node:assert/strict');
const backups = require('../.test-build/template-backups');
const template = { id: 1, name: 'Review', description: 'Sample review', quantity: 1, cents: 1500 };
const envelope = templates => JSON.stringify({ kind: 'quote-builder-templates', version: 1, templates });
assert.deepEqual(backups.parseTemplateBackup(envelope([template])), [template]);
assert.throws(() => backups.parseTemplateBackup(JSON.stringify({ kind: 'quote-builder', version: 1, drafts: [] })));
assert.throws(() => backups.parseTemplateBackup(envelope([template, template])));
assert.throws(() => backups.parseTemplateBackup(' '.repeat(512001)));

assert.deepEqual(backups.parseTemplateBackup(backups.serializeTemplateBackup([template])), [template]);
assert.throws(() => backups.serializeTemplateBackup([{ ...template, cents: -1 }]));

const maximum = Array.from({ length: 30 }, (_, i) => ({ id: i + 1, name: '\0'.repeat(80), description: '\0'.repeat(120), quantity: 999, cents: 99999999 }));
assert.deepEqual(backups.parseTemplateBackup(backups.serializeTemplateBackup(maximum)), maximum);
assert.throws(() => backups.serializeTemplateBackup([...maximum, { ...template, id: 31 }]));
assert.deepEqual(backups.parseTemplateBackup(backups.serializeTemplateBackup([{ ...template, name: '😀'.repeat(40) }])), [{ ...template, name: '😀'.repeat(40) }]);
