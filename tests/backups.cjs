const assert = require('node:assert/strict');
const backup = require('../.test-build/backups.js');
const { newDraft } = require('../.test-build/drafts.js');
const draft = newDraft('one');
const raw = JSON.stringify({
  kind: 'quote-builder',
  version: 1,
  drafts: [draft],
});
assert.deepEqual(backup.parseBackup(raw), [draft]);
for (const raw of [
  'x'.repeat(1000001),
  'null',
  '{}',
  JSON.stringify({ kind: 'quote-builder', version: 2, drafts: [] }),
])
  assert.throws(() => backup.parseBackup(raw));
assert.throws(() => backup.parseBackup('😀'.repeat(250001)));
assert.throws(() =>
  backup.parseBackup(
    JSON.stringify({
      kind: 'quote-builder',
      version: 1,
      drafts: [draft, draft],
    })
  )
);
assert.throws(() =>
  backup.parseBackup(
    JSON.stringify({
      kind: 'quote-builder',
      version: 1,
      drafts: [
        {
          ...draft,
          items: [{ id: 1, description: 'Bad', quantity: 1, cents: -1 }],
        },
      ],
    })
  )
);
assert.equal(backup.mergeBackup([draft], [draft])[1].id, 'import-1');
assert.throws(() => backup.mergeBackup(Array(20).fill(draft), [draft]));
assert.equal(
  backup.mergeBackup([draft], [draft])[1].name,
  'Untitled quote (import 1)'
);
assert.equal(
  backup.mergeBackup([draft], [draft, draft])[2].name,
  'Untitled quote (import 2)'
);
assert.deepEqual(backup.parseBackup(backup.serializeBackup([draft])), [draft]);
assert.throws(() => backup.serializeBackup(Array(21).fill(draft)));
const twenty = Array.from({ length: 20 }, (_, i) => ({
  ...draft,
  id: String(i),
}));
assert.equal(backup.mergeBackup(twenty, []).length, 20);
assert.throws(() => backup.mergeBackup(twenty, [draft]));
assert.equal(twenty.length, 20);
(async () => {
  await assert.rejects(
    backup.readBackupFile({
      size: 1,
      text: async () => {
        throw Error('denied');
      },
    }),
    /could not be read/
  );
  await assert.rejects(
    backup.readBackupFile({ size: 1000001, text: async () => raw })
  );
})();
assert.throws(() =>
  backup.parseBackup(
    JSON.stringify({
      kind: 'quote-builder',
      version: 1,
      drafts: [{ ...draft, name: '' }],
    })
  )
);
const preserved = JSON.stringify([draft]);
assert.throws(() => backup.mergeBackup([draft], [{ ...draft, name: '' }]));
assert.equal(JSON.stringify([draft]), preserved);
const complete = {
  ...draft,
  name: 'Sample estimate',
  reference: 'DEMO-1',
  notes: 'Line one\nLine two',
  discount: 15,
  items: [{ id: 1, description: 'Sample work', quantity: 3, cents: 1234 }],
};
assert.deepEqual(backup.parseBackup(backup.serializeBackup([complete])), [
  complete,
]);
const merged = backup.mergeBackup([complete], [complete]);
assert.equal(merged[1].items[0].cents, 1234);
assert.equal(merged[1].notes, complete.notes);
