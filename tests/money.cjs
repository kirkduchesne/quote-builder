const assert = require('node:assert/strict');
const { parseCents, dollars } = require('/tmp/quote-builder-tests/money.js');
assert.equal(parseCents('12.34'),1234);
assert.equal(parseCents('0.1'),10);
assert.equal(parseCents('0'),0);
for (const value of ['-1','1.001','1e3','Infinity','','.5','1000000']) assert.equal(parseCents(value),null);
assert.equal(dollars(1234),'$12.34');
console.log('Money tests passed');
