const assert = require('node:assert/strict');
const { truncateText } = require('../.test-build/text');
const { newDraft, validDraft } = require('../.test-build/drafts');
const { duplicateDraft } = require('../.test-build/quote-operations');
const { restoredDraft } = require('../.test-build/revisions');
const { mergeBackup } = require('../.test-build/backups');
const { mergeTemplateBackup } = require('../.test-build/template-backups');
assert.equal(truncateText('a😀b', 2), 'a');
assert.equal(truncateText('a😀b', 3), 'a😀');
assert.equal(truncateText('😀', 0), '');
for (const name of [
  '😀'.repeat(40),
  'a' + '😀'.repeat(39) + 'b',
  'x'.repeat(68) + '😀'.repeat(6),
  'x'.repeat(72) + '😀'.repeat(4),
  'x'.repeat(80),
]) {
  const draft = { ...newDraft('original'), name };
  const template = {
    id: 1,
    name,
    description: 'Example',
    quantity: 1,
    cents: 100,
  };
  const copy = duplicateDraft([], draft);
  const restored = restoredDraft(draft, [], [draft.id]);
  const imported = mergeBackup([draft], [draft])[1];
  const importedTemplate = mergeTemplateBackup([template], [template])[1];
  for (const result of [copy, restored, imported, importedTemplate]) {
    assert(result.name.length <= 80);
    assert.equal(
      Buffer.from(result.name).toString('utf8'),
      result.name,
      'no isolated surrogate introduced',
    );
  }
  assert(validDraft(copy));
  assert(validDraft(restored));
  assert(validDraft(imported));
  assert.equal(copy.name, truncateText(name, 73) + ' (copy)');
  assert.equal(restored.name, copy.name);
  assert.equal(imported.name, truncateText(name, 69) + ' (import 1)');
  assert.equal(importedTemplate.name, imported.name);
}
console.log('Unicode suffix boundaries passed for all four copy/import paths');
