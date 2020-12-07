const toTypeString = (value: unknown): string => Object.prototype.toString.call(value)
export const isObject = (val: unknown): val is object => val !== null && typeof val === 'object'
export const isMap = (val: unknown): val is Map<unknown, unknown> => toTypeString(val) === '[object Map]'
export const isSet = (val: unknown): val is Set<unknown> => toTypeString(val) === '[object Set]'
