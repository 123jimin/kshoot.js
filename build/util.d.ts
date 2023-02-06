/**
 * Permissively converts the given value to the given type.
 * @param type Type of the value
 * @param value Value to be converted
 * @param [empty] Default value when the given value is empty or invalid
 * @returns `value`, converted to the given type, or `empty` if `value` is empty or invalid
 */
declare function getValue(type: 'string', value: unknown): string | undefined;
declare function getValue(type: 'string', value: unknown, empty: string): string;
declare function getValue(type: 'number', value: unknown): number | undefined;
declare function getValue(type: 'number', value: unknown, empty: number): number;
declare function getValue(type: 'integer', value: unknown): number | undefined;
declare function getValue(type: 'integer', value: unknown, empty: number): number;
declare function getValue(type: 'bigint', value: unknown): bigint | undefined;
declare function getValue(type: 'bigint', value: unknown, empty: bigint): bigint;
declare function getValue(type: 'string' | 'number' | 'integer' | 'bigint', value: unknown, empty?: string | number | bigint): string | number | bigint | undefined;
/**
 * Permissively converts `obj.key` to the given type.
 * @param type Type of the value
 * @param key
 * @param obj
 * @returns `obj.key`, converted to the given type, or `empty` if `obj.key` is empty or invalid
 */
declare function getField(type: 'string', key: string, obj: {
    [key: string]: unknown;
}): string | undefined;
declare function getField(type: 'string', key: string, obj: {
    [key: string]: unknown;
}, empty: string): string;
declare function getField(type: 'number', key: string, obj: {
    [key: string]: unknown;
}): number | undefined;
declare function getField(type: 'number', key: string, obj: {
    [key: string]: unknown;
}, empty: number): number;
declare function getField(type: 'integer', key: string, obj: {
    [key: string]: unknown;
}): number | undefined;
declare function getField(type: 'integer', key: string, obj: {
    [key: string]: unknown;
}, empty: number): number;
declare function getField(type: 'bigint', key: string, obj: {
    [key: string]: unknown;
}): bigint | undefined;
declare function getField(type: 'bigint', key: string, obj: {
    [key: string]: unknown;
}, empty: bigint): bigint;
export { getValue, getField };
