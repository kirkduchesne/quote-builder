const assert = require("node:assert/strict");
const { parseCents, dollars } = require("../.test-build/money.js");
assert.equal(parseCents("12.34"), 1234);
assert.equal(parseCents("0.1"), 10);
assert.equal(parseCents("0"), 0);
for (const value of ["-1", "1.001", "1e3", "Infinity", "", ".5", "1000000"])
  assert.equal(parseCents(value), null);
assert.equal(dollars(1234), "$12.34");
console.log("Money tests passed");
const { calculateTotal } = require("../.test-build/money.js");
assert.deepEqual(calculateTotal([{ quantity: 3, cents: 10 }], 10), {
  subtotal: 30,
  saving: 3,
  total: 27,
});
assert.deepEqual(calculateTotal([{ quantity: 1, cents: 5 }], 10), {
  subtotal: 5,
  saving: 1,
  total: 4,
});
assert.equal(
  calculateTotal([{ quantity: 999, cents: 99999999 }], 100).total,
  0,
);
assert.equal(calculateTotal([], 0).total, 0);
for (const discount of [-1, 101, 0.5, NaN])
  assert.throws(() => calculateTotal([], discount));
for (const item of [
  { quantity: 0, cents: 1 },
  { quantity: 1000, cents: 1 },
  { quantity: 1, cents: -1 },
  { quantity: 1, cents: 0.5 },
])
  assert.throws(() => calculateTotal([item], 0));
assert.equal(
  calculateTotal(
    Array.from({ length: 100 }, () => ({ quantity: 999, cents: 99999999 })),
    1,
  ).total,
  9890099901099,
);
assert.equal(parseCents("999999.99"), 99999999);
assert.equal(calculateTotal([{ quantity: 1, cents: 1 }], 50).total, 0);
