/**
 * @nyahub/jsonsafe
 * Copyright (C) 2026 nyahub
 * * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation...
 */

export type JSONReviver = (this: any, key: string, value: any, context?: {
    source?: string;
}) => any;
export type JSONReplacerFn = (this: any, key: string, value: any) => any;
export type JSONReplacerBase = (number | string)[] | null
export type JSONReplacer = JSONReplacerBase | JSONReplacerFn;

interface IJSONSafe {
    parse(text: string, reviver?: JSONReviver): any;
    stringify(value: any, replacer?: JSONReplacerFn, space?: string | number): string;
    stringify(value: any, replacer?: JSONReplacerBase, space?: string | number): string;
    readonly nativeRaw: boolean;
    readonly nativeCTX: boolean;
    useRaw: boolean;
}

// @ts-ignore
const HAS_RAW = typeof JSON.rawJSON === 'function'
const HAS_CTX = (() => {
    try {
        let supported = false;
        // @ts-ignore
        JSON.parse('1', (_k, _v, context) => {
            supported = !!(context && 'source' in context);
        });
        return supported;
    } catch {
        return false;
    }
})();

let useRaw = HAS_RAW

export const JSONSafe: IJSONSafe = {
    /**
     * Converts a JavaScript Object Notation (JSON) string into an object.
     * 
     * @param {string} text A valid JSON string.
     * @param reviver A function that transforms the results. This function is called for each member of the object. If a member contains nested objects, the nested objects are transformed before the parent object is.
     * @throws {SyntaxError} If text is not valid JSON.
     */
    parse(text: string, reviver?: JSONReviver) {
        const fixedJson = HAS_CTX ? text : text.replace(/(?<!")\b(-?\d{15,})\b(?!")/g, '"$1"');
        // @ts-ignore
        return JSON.parse(fixedJson, function (key, value, ctx) {
            if (HAS_CTX && typeof value === 'number' && ctx?.source?.length >= 15) {
                value = BigInt(ctx.source);
            }
            if (typeof value === 'string' && /^-?\d{15,}$/.test(value)) {
                value = BigInt(value);
            }
            return reviver ? reviver.call(this, key, value, ctx) : value;
        });
    },
    /**
     * Converts a JavaScript value to a JavaScript Object Notation (JSON) string.
     * 
     * @param value A JavaScript value, usually an object or array, to be converted.
     * @param replacer A function that transforms the results.
     * @param space Adds indentation, white space, and line break characters to the return-value JSON text to make it easier to read.
     * @throws {TypeError} If a circular reference or a BigInt value is found.
     */
    stringify(value: any, replacer?: JSONReplacer, space?: string | number) {
        // @ts-ignore
        const checkBN = (value) => typeof value === "bigint" ? (useRaw ? JSON.rawJSON(value) : value.toString()) : value

        if (typeof replacer === 'function') {
            return JSON.stringify(value, function (key: string, value: any) {
                const result = replacer.call(this, key, value)
                return checkBN(result)
            }, space)
        }
        if (Array.isArray(replacer)) {
            const set = new Set(replacer.filter(r => ['number', 'string'].includes(typeof r)).map(String))
            return JSON.stringify(value, function (key: string, value: any) {
                if (key !== "" && !set.has(key)) return undefined
                return checkBN(value)
            }, space)
        }
        return JSON.stringify(value, function (_key: string, value: any) {
            return checkBN(value)
        }, space)
    }
} as IJSONSafe
Object.defineProperty(JSONSafe, "nativeRaw", {
    writable: false,
    enumerable: true,
    value: HAS_RAW
})

Object.defineProperty(JSONSafe, "nativeCTX", {
    writable: false,
    enumerable: true,
    value: HAS_CTX
})

Object.defineProperty(JSONSafe, "useRaw", {
    enumerable: true,
    get() {
        return useRaw
    },
    set(v: boolean) {
        useRaw = HAS_RAW && v
    }
})

export default JSONSafe