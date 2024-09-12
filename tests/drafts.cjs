const assert = require('node:assert/strict');
const { newDraft, validDraft, parseDrafts } = require('/tmp/quote-builder-tests/drafts.js');
const draft = newDraft('one');
assert(validDraft(draft));
assert.equal(parseDrafts(JSON.stringify({version:1,drafts:[draft]})).length,1);
for(const raw of ['', 'null', '{}', '{', JSON.stringify({version:2,drafts:[]}),JSON.stringify({version:1,drafts:[draft,draft]})]) assert.throws(()=>parseDrafts(raw));
for(const patch of [{name:''},{discount:101},{discount:0.5},{notes:'x'.repeat(1001)},{items:[{id:1,description:'a',quantity:1,cents:-1}]}]) assert(!validDraft({...draft,...patch}));
const item={id:1,description:'A',quantity:999,cents:99999999};assert(validDraft({...draft,items:[item]}));assert(!validDraft({...draft,items:[item,item]}));
console.log('Draft validation tests passed');
