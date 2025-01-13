const assert=require('node:assert/strict');
const storage=require('../.test-build/template-storage.js');
assert(storage.loadTemplates({getItem:()=>null}).readable);
assert(!storage.loadTemplates({getItem:()=>''}).readable);
