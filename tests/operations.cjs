const assert=require('node:assert/strict');
const op=require('../.test-build/quote-operations.js');
const {newDraft}=require('../.test-build/drafts.js');
const line={id:1,description:'Work',quantity:1,cents:100};
assert.equal(op.duplicateLine([line],1)[1].id,2);
assert.throws(()=>op.duplicateLine(Array(100).fill(line),1));
