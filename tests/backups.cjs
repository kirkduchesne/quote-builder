const assert=require('node:assert/strict');
const backup=require('../.test-build/backups.js');
const {newDraft}=require('../.test-build/drafts.js');
const draft=newDraft('one');
const raw=JSON.stringify({kind:'quote-builder',version:1,drafts:[draft]});
assert.deepEqual(backup.parseBackup(raw),[draft]);
for(const raw of ['x'.repeat(1000001),'null','{}',JSON.stringify({kind:'quote-builder',version:2,drafts:[]})])assert.throws(()=>backup.parseBackup(raw));
assert.throws(()=>backup.parseBackup('😀'.repeat(250001)));
