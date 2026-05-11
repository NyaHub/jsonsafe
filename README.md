# @nyahub/jsonsafe

A lightweight, zero-dependency wrapper around native JSON module with seamless BigInt support.

## Why?

Standard JavaScript JSON.parse loses precision for large integers (greater than Number.MAX_SAFE_INTEGER). Other libraries often rewrite the entire parser in JS, which is slow. @nyahub/jsonsafe uses native V8 methods.

On modern environments (Node.js 20+), it utilizes the native context.source feature. On older platforms, it uses a tiny, high-performance regex pre-processor.

## Features

- **Zero dependencies**: Only native Node.js/V8 features.
- **Native Speed**: Uses built-in JSON methods under the hood.
- **Transparent**: 1:1 API compatibility with standard JSON.
- **Safe**: Doesn't mutate global prototypes or "break userspace".
- **Future-Proof**: Supports context.source (parsing) and JSON.rawJSON (serialization) where available.
- **Context Aware**: Correcty preserves this and all arguments in reviver/replacer functions.

## Installation

```bash
npm install @nyahub/jsonsafe
```

## Usage

```js
import { JSONSafe } from "@nyahub/jsonsafe";

const json = '{"id": 9007199254740993}';

// Standard JSON.parse would return 9007199254740992
const data = JSONSafe.parse(json);
console.log(data.id); // 9007199254740993n (BigInt)

const output = JSONSafe.stringify(data);
console.log(output); // {"id":"9007199254740993"}
```

## Advanced Configuration

The library provides flags to inspect environment capabilities and toggle behavior:

- `JSONSafe.nativeCTX`: `true` if the environment supports the native `reviver` context (Node.js 20+, modern browsers).
- `JSONSafe.nativeRaw`: `true` if `JSON.rawJSON` is available natively.
- `JSONSafe.useRaw`: `Boolean` flag (default: `nativeRaw`).
  - If `true`, `BigInt` will be serialized using `JSON.rawJSON` (no quotes in output).
  - If `false`, `BigInt` will be serialized as a string.

```js
JSONSafe.useRaw = true; // Use native rawJSON if available
console.log(JSONSafe.stringify({ val: 123n })); // {"val":123}
```

## How it works

- **Parsing**: If `nativeCTX` is missing, integers longer than 15 digits are wrapped in quotes before `JSON.parse`. If `nativeCTX` exists, it uses `context.source` to recover `BigInt` values directly from the stream.
- **Stringifying**: `BigInt` values are automatically converted to strings (or `rawJSON`) to prevent `TypeError`.
- **Reliability**: It **does not break** native behavior. All `reviver` and `replacer` functions are called with the correct `this` context and arguments, exactly like the native `JSON` module.
