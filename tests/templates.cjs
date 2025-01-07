const assert=require('node:assert/strict');
const t=require('../.test-build/templates.js');
const sample={id:1,name:'Design',description:'Design work',quantity:1,cents:10000};
assert(t.validTemplate(sample));
assert(!t.validTemplate({...sample,quantity:0}));
