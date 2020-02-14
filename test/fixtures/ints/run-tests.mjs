import {
	bytesToInt8,
	bytesToInt16,
	bytesToInt32,
	bytesToInt64,
} from "../../../index.mjs";
import assert from "assert";

import int8Tests  from "./int8.mjs";
import int16Tests from "./int16.mjs";
import int32Tests from "./int32.mjs";
import int64tests from "./int64.mjs";

for(const [byte, int] of Object.entries(int8Tests)){
	assert.deepStrictEqual(bytesToInt8([+byte]), new Int8Array([int]));
	assert.deepStrictEqual([...new Int8Array([int])], [int]);
}

runTests(bytesToInt16, int16Tests, Int16Array, 4);
runTests(bytesToInt32, int32Tests, Int32Array, 8);
runTests(bytesToInt64, int64tests, BigInt64Array, 16);


/**
 * Test byte-to-int conversion functions against C-generated integer lists.
 * @param {Function} fn
 * @param {Function} typedArray
 * @param {Object} tests
 * @param {Number} length
 * @return {void}
 */
function runTests(fn, tests, typedArray, length){
	for(let [bytes, int] of Object.entries(tests)){
		bytes = split(bytes, length);
		for(let le = false, i = 0; i < 2; ++i){
			assert.deepStrictEqual(fn(bytes, le), typedArray.from([int]));
			assert.deepStrictEqual([...typedArray.from([int])], [int]);
			bytes.reverse();
			le = true;
		}
	}
}


/**
 * Split a string containing an integer into actual bytes.
 * @example split("65535", 2) == [0xFF, 0xFF];
 * @param {String} value
 * @param {Number} [bytes=2]
 * @return {Number[]}
 */
function split(value, bytes = 2){
	value = bytes > 8
		? BigInt(value).toString(16).replace(/n$/, "")
		: Number(value).toString(16);
	return value.padStart(bytes, "0").match(/.{2}/g).map(x => parseInt(x, 16));
}
