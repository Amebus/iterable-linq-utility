/**
 * Checks if `value` is classified as a `Function` object.
 *
 * From [LoDash isFunction](https://github.com/lodash/lodash/blob/2f79053d7bc7c9c9561a30dda202b3dcd2b72b90/isFunction.js)
 * 
 * @since 1.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * isFunction(class Any{})
 * // => true
 *
 * isFunction(() => {})
 * // => true
 *
 * isFunction(async () => {})
 * // => true
 *
 * isFunction(function * Any() {})
 * // => true
 *
 * isFunction(Math.round)
 * // => true
 *
 * isFunction(/abc/)
 * // => false
 */
export function isFunction(value?: any): value is (...args: any[]) => any {
  return typeof value === 'function';
  // https://jsben.ch/B6h73
	// return !!(object && object.constructor && object.call && object.apply);
}

/**
 * 
 * Checks if `value` is classified as a `String` primitive or object.  
 * 
 * From [LoDash isString](https://github.com/lodash/lodash/blob/master/isString.js)
 * 
 * @since 1.0.0
 * @param {*} value The value to check. 
 * @returns {boolean} Returns `true` if `value` is a string, else `false`.
 * @example
 *
 * isString('abc')
 * // => true
 *
 * isString(1)
 * // => false
 */
// export function isString(value?: any): value is string {
// 	const type = typeof value;
//   return type === 'string' || (type === 'object' && value != null && !Array.isArray(value) && getTag(value) == '[object String]');
// }

// const toString = Object.prototype.toString;

/**
 * Gets the `toStringTag` of `value`.
 *
 * From [LoDash internal getTag](https://github.com/lodash/lodash/blob/master/.internal/getTag.js)
 * 
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
// function getTag(value: any): string {
//   if (value == null) {
//     return value === undefined ? '[object Undefined]' : '[object Null]';
//   }
//   return toString.call(value);
// }
