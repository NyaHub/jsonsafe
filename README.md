# @nyahub/jsonsafe

A lightweight, zero-dependency wrapper around native JSON module with seamless BigInt support.

## Why?

Standard JavaScript JSON.parse loses precision for large integers (greater than Number.MAX_SAFE_INTEGER). Other libraries often rewrite the entire parser in JS, which is slow. @nyahub/jsonsafe uses native V8 methods with a tiny regex pre-processor, keeping it fast and reliable.

## Features

 - Zero dependencies: Only native Node.js/V8 features.
 - Native Speed: Uses built-in JSON methods under the hood.
 - Transparent: 1:1 API compatibility with standard JSON.
 - Safe: Doesn't mutate global prototypes or "break userspace".

## Installation

```bash
npm install @nyahub/jsonsafe
```

## Usage
```js
import { JSONSafe } from '@nyahub/jsonsafe';

const json = '{"id": 9007199254740993}';

// Standard JSON.parse would return 9007199254740992
const data = JSONSafe.parse(json);
console.log(data.id); // 9007199254740993n (BigInt)

const output = JSONSafe.stringify(data);
console.log(output); // {"id":"9007199254740993"}
```

## How it works

 - Parsing: Numbers longer than 15 digits are automatically wrapped in quotes before JSON.parse and then converted to BigInt via a reviver.
 - Stringifying: BigInt values are automatically converted to strings to prevent TypeError.