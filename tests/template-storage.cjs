const assert=require('node:assert/strict');
const storage=require('../.test-build/template-storage.js');
assert(storage.loadTemplates({getItem:()=>null}).readable);
assert(!storage.loadTemplates({getItem:()=>''}).readable);
let raw=null;const store={getItem:()=>raw,setItem:(k,v)=>{raw=v;}};
storage.saveTemplates(store,[],null);assert.equal(raw,'{"version":1,"templates":[]}');
assert.throws(()=>storage.saveTemplates(store,[],null));
