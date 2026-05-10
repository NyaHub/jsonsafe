import test from 'node:test';
import assert from 'node:assert/strict';
import { JSONSafe } from '../dist/json.js';

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min) + min);
const genRandomNumStr = (isLong: boolean) => {
  let s = '';
  let len = isLong ? randInt(15, 20) : randInt(1, 14);
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10);
  return s.replace(/^0+/, '1') || '1';
};
const rng = () => Math.random() > 0.5;

test('Fuzz-test', async (t) => {
  for (let i = 0; i < 50; i++) {
    let isLong = rng();
    const numStr = genRandomNumStr(isLong);
    isLong = numStr.length >= 15
    const expectedType = isLong ? 'bigint' : 'number';

    await t.test(`Iteration ${i}: length ${numStr.length} (${expectedType})`, () => {
      const json = `{"val": ${numStr}}`;
      const parsed = JSONSafe.parse(json);

      if (expectedType === 'bigint') {
        assert.equal(typeof parsed.val, 'bigint');
        assert.equal(parsed.val.toString(), numStr);
      } else {
        assert.equal(typeof parsed.val, 'number');
        assert.equal(parsed.val, Number(numStr));
      }

      const stringified = JSONSafe.stringify(parsed);
      assert.ok(stringified.replace(/\s/g, '').includes(isLong ? `"val":"${numStr}"` : `"val":${numStr}`));
    });
  }
});

test('MDN (Native Behavior)', async (t) => {
  await t.test('space', () => {
    const obj = { a: 1, b: { c: 2n } };
    const res = JSONSafe.stringify(obj, null, 2);
    assert.ok(res.includes('\n  "a": 1'));
  });

  await t.test('null and undefined', () => {
    const obj = { a: null, b: undefined, c: [undefined] };
    const res = JSONSafe.stringify(obj);
    assert.equal(res, '{"a":null,"c":[null]}');
  });

  await t.test('replacer', () => {
    const obj = { a: 1, b: 2 };
    const res = JSONSafe.stringify(obj, (key, val) => (key === 'a' ? undefined : val));
    assert.equal(res, '{"b":2}');
  });
});

test('structures', () => {
  const deepData = {
    level1: {
      long: BigInt(genRandomNumStr(true)),
      short: Number(genRandomNumStr(false)),
      arr: [BigInt(genRandomNumStr(true)), Number(genRandomNumStr(false)), { deep: genRandomNumStr(true) }]
    }
  }

  const res = JSONSafe.parse(JSONSafe.stringify(deepData))
  
  assert.equal(typeof res.level1.long, 'bigint')
  assert.equal(typeof res.level1.short, 'number')
  assert.equal(typeof res.level1.arr[0], 'bigint')
  assert.equal(typeof res.level1.arr[1], 'number')
  assert.equal(typeof res.level1.arr[2].deep, 'bigint')
})

test('MDN (Native JSON.parse behavior)', async (t) => {
  await t.test('reviver', () => {
    const json = '{"a": 1, "b": "delete_me", "c": 9007199254740999}';
    
    const result = JSONSafe.parse(json, (key, value) => {
      if (value === 'delete_me') return undefined;
      if (typeof value === 'bigint') return value + 1n;
      return value;
    });

    assert.equal(result.a, 1);
    assert.strictEqual(result.b, undefined);
    assert.equal(result.c, 9007199254741000n);
    assert.ok(!Object.prototype.hasOwnProperty.call(result, 'b'));
  });

  await t.test('Корректная обработка пустых структур', () => {
    assert.deepEqual(JSONSafe.parse('{}'), {});
    assert.deepEqual(JSONSafe.parse('[]'), []);
    assert.strictEqual(JSONSafe.parse('null'), null);
    assert.strictEqual(JSONSafe.parse('true'), true);
    assert.strictEqual(JSONSafe.parse('false'), false);
  });

  await t.test('Выбрасывание SyntaxError при кривом JSON', () => {
    assert.throws(() => JSONSafe.parse('{"invalid": json}'), SyntaxError);
    assert.throws(() => JSONSafe.parse(''), SyntaxError);
  });
});