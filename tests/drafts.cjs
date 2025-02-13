const assert = require("node:assert/strict");
const {
  newDraft,
  validDraft,
  parseDrafts,
} = require("../.test-build/drafts.js");
const draft = newDraft("one");
assert(validDraft(draft));
assert.equal(
  parseDrafts(JSON.stringify({ version: 1, drafts: [draft] })).length,
  1,
);
for (const raw of [
  "",
  "null",
  "{}",
  "{",
  JSON.stringify({ version: 2, drafts: [] }),
  JSON.stringify({ version: 1, drafts: [draft, draft] }),
])
  assert.throws(() => parseDrafts(raw));
for (const patch of [
  { name: "" },
  { discount: 101 },
  { discount: 0.5 },
  { notes: "x".repeat(1001) },
  { items: [{ id: 1, description: "a", quantity: 1, cents: -1 }] },
])
  assert(!validDraft({ ...draft, ...patch }));
const item = { id: 1, description: "A", quantity: 999, cents: 99999999 };
assert(validDraft({ ...draft, items: [item] }));
assert(!validDraft({ ...draft, items: [item, item] }));
console.log("Draft validation tests passed");

const { unusedItemId } = require('../.test-build/drafts.js');
assert.equal(unusedItemId([]), 1);
assert.equal(unusedItemId([{...item,id:1},{...item,id:3}]), 2);
const highId = {...item, id: Number.MAX_SAFE_INTEGER - 1};
assert(validDraft({...draft,items:[highId]}));
const nextItem = {...item,id:unusedItemId([highId])};
assert.equal(nextItem.id, 1);
assert(validDraft({...draft,items:[highId,nextItem]}));
const {normalizedQuoteName}=require('../.test-build/drafts.js');
assert.equal(normalizedQuoteName(' Work '),'Work');assert.equal(normalizedQuoteName(' '),null);assert.equal(normalizedQuoteName('x'.repeat(81)),null);
assert(!validDraft({...draft,reference:'x'.repeat(81)}));
assert(validDraft({...draft,reference:'x'.repeat(80),notes:'x'.repeat(1000)}));
assert(!validDraft({...draft,items:[{...item,description:'x'.repeat(121)}]}));
