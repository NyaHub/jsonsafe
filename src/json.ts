/**
 * @nyahub/jsonsafe
 * Copyright (C) 2026 nyahub
 * * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation...
 */

type JSONRepRevFN = (this: any, key: string, value: any) => any
type JSONReplacer = (number | string)[] | null | JSONRepRevFN

export const JSONSafe = {
    /**
     * Converts a JavaScript Object Notation (JSON) string into an object.
     * 
     * @param {string} text A valid JSON string.
     * @param reviver A function that transforms the results. This function is called for each member of the object. If a member contains nested objects, the nested objects are transformed before the parent object is.
     * @throws {SyntaxError} If text is not valid JSON.
     */
    parse(text: string, reviver?: JSONRepRevFN) {
        const fixedJson = text.replace(/(?<!")\b(-?\d{15,})\b(?!")/g, '"$1"');
        return JSON.parse(fixedJson, function (key, value) {
            value = reviver ? reviver.call(this, key, value) : value
            if (typeof value === 'string' && /^-?\d{15,}$/.test(value)) {
                return BigInt(value);
            }
            return value;
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
        const checkBN = (value) => typeof value === "bigint" ? value.toString() : value

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
        return JSON.stringify(value, function (key: string, value: any) {
            return checkBN(value)
        }, space)
    }
}

export default JSONSafe