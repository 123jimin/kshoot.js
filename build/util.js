function getValue(type, value, empty) {
    switch (typeof value) {
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
    switch (type) {
        case 'string':
            return `${value}`;
        case 'number':
        case 'integer': {
            let numeric_value = empty;
            if (typeof value === 'number') {
                if (type === 'integer')
                    numeric_value = Math.floor(value);
                else
                    numeric_value = value;
            }
            else if (typeof value === 'boolean') {
                numeric_value = +value;
            }
            else {
                if (type === 'integer')
                    numeric_value = parseInt(`${value}`);
                else
                    numeric_value = parseFloat(`${value}`);
            }
            if (!Number.isFinite(numeric_value))
                return empty;
            if (type === 'integer' && !Number.isSafeInteger(numeric_value))
                return empty;
            return numeric_value;
        }
        case 'bigint': {
            let bigint_value = BigInt(empty ?? 0);
            try {
                if (typeof value === 'bigint') {
                    return value;
                }
                bigint_value = BigInt(value);
            }
            catch (_) { /* empty */ }
            return bigint_value;
        }
    }
}
function getField(type, key, obj, empty) {
    if (!(key in obj))
        return empty;
    return getValue(type, obj[key], empty);
}
export { getValue, getField };
