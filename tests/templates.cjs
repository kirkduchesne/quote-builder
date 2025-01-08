const assert=require('node:assert/strict');
const t=require('../.test-build/templates.js');
const sample={id:1,name:'Design',description:'Design work',quantity:1,cents:10000};
assert(t.validTemplate(sample));
assert(!t.validTemplate({...sample,quantity:0}));
assert.deepEqual(t.parseTemplates(JSON.stringify({version:1,templates:[sample]})),[sample]);
assert.throws(()=>t.parseTemplates(JSON.stringify({version:1,templates:[sample,sample]})));
