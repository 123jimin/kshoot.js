/**
 * Permissively converts the given value to the given type.
 * @param type Type of the value
 * @param value Value to be converted
 * @param [empty] Default value when the given value is empty or invalid
 * @returns `value`, converted to the given type, or `empty` if `value` is empty or invalid
 */
function getValue(type: 'string', value: unknown): string|undefined;
function getValue(type: 'string', value: unknown, empty: string): string;
function getValue(type: 'number', value: unknown): number|undefined;
function getValue(type: 'number', value: unknown, empty: number): number;
function getValue(type: 'integer', value: unknown): number|undefined;
function getValue(type: 'integer', value: unknown, empty: number): number;
function getValue(type: 'bigint', value: unknown): bigint|undefined;
function getValue(type: 'bigint', value: unknown, empty: bigint): bigint;
function getValue(type: 'string'|'number'|'integer'|'bigint', value: unknown, empty?: string|number|bigint): string|number|bigint|undefined;
function getValue(type: 'string'|'number'|'integer'|'bigint', value: unknown, empty?: string|number|bigint): string|number|bigint|undefined {
    switch(typeof value) {
        case 'bigint':
        case 'number':
        case 'string':
        case 'boolean':
            break;
        case 'object':
        case 'undefined':
        default:
            return empty;
    }

    switch(type) {
        case 'string':
            return `${value}`;
        case 'number':
        case 'integer': {
            let numeric_value = empty as number;
            if(typeof value === 'number') {
                if(type === 'integer') numeric_value = Math.floor(value);
                else numeric_value = value;
            } else if(typeof value === 'boolean') {
                numeric_value = +value;
            } else {
                if(type === 'integer') numeric_value = parseInt(`${value}`);
                else numeric_value = parseFloat(`${value}`);
            }

            if(!Number.isFinite(numeric_value)) return empty;
            if(type === 'integer' && !Number.isSafeInteger(numeric_value)) return empty;
            return numeric_value;
        }
        case 'bigint': {
            let bigint_value = BigInt(empty ?? 0);

            try {
                if(typeof value === 'bigint') {
                    return value;
                }

                bigint_value = BigInt(value);
            } catch(_) { /* empty */ }

            return bigint_value;
        }
    }
}

/**
 * Permissively converts `obj.key` to the given type.
 * @param type Type of the value
 * @param key
 * @param obj
 * @returns `obj.key`, converted to the given type, or `empty` if `obj.key` is empty or invalid
 */
function getField(type: 'string', key: string, obj: {[key: string]: unknown}): string|undefined;
function getField(type: 'string', key: string, obj: {[key: string]: unknown}, empty: string): string;
function getField(type: 'number', key: string, obj: {[key: string]: unknown}): number|undefined;
function getField(type: 'number', key: string, obj: {[key: string]: unknown}, empty: number): number;
function getField(type: 'integer', key: string, obj: {[key: string]: unknown}): number|undefined;
function getField(type: 'integer', key: string, obj: {[key: string]: unknown}, empty: number): number;
function getField(type: 'bigint', key: string, obj: {[key: string]: unknown}): bigint|undefined;
function getField(type: 'bigint', key: string, obj: {[key: string]: unknown}, empty: bigint): bigint;
function getField(type: 'string'|'number'|'integer'|'bigint', key: string, obj: {[key: string]: unknown}, empty?: string|number|bigint): string|number|bigint|undefined {
    if(!(key in obj)) return empty;

    return getValue(type, obj[key], empty);
}

export { getValue, getField };