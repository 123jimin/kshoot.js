// Note that this definition is semantically compatible with KSON specification,
// but technically the Kson type is a strict subset of the spec.
// Therefore, these types can't be used to create a JSON schema.
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
        case 'integer':
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
        case 'bigint':
            let bigint_value = BigInt(empty ?? 0);
            try {
                if (typeof value === 'bigint') {
                    return value;
                }
                bigint_value = BigInt(value);
            }
            catch (_) { }
            return bigint_value;
    }
}
function getField(type, key, obj, empty) {
    if (!(key in obj))
        return empty;
    return getValue(type, obj[key], empty);
}
export function createMetaInfo(obj = {}) {
    return {
        title: getField('string', 'title', obj, ""),
        title_translit: getField('string', 'title_translit', obj),
        title_img_filename: getField('string', 'title_img_filename', obj),
        artist: getField('string', 'artist', obj, ""),
        artist_translit: getField('string', 'artist_translit', obj),
        artist_img_filename: getField('string', 'artist_img_filename', obj),
        chart_author: getField('string', 'chart_author', obj, ""),
        difficulty: 'difficulty' in obj ? (typeof obj.difficulty === 'number' ? obj.difficulty : `${obj.difficulty}`) : 0,
        level: getField('integer', 'level', obj, 1),
        disp_bpm: getField('string', 'disp_bpm', obj, "120"),
        std_bpm: getField('number', 'std_bpm', obj),
        jacket_filename: getField('string', 'jacket_filename', obj),
        jacket_author: getField('string', 'jacket_author', obj),
        icon_filename: getField('string', 'icon_filename', obj),
        information: getField('string', 'information', obj),
    };
}
export function createBeatInfo(obj = {}) {
    let bpm_arr = [[0n, 120]];
    let time_sig_arr = [[0n, [4, 4]]];
    let scroll_speed_arr = [createGraphPoint([0n, 1.0])];
    return {
        bpm: bpm_arr,
        time_sig: time_sig_arr,
        scroll_speed: scroll_speed_arr,
    };
}
export function createGraphValue(obj) {
    if (Array.isArray(obj) && obj.length >= 1) {
        const v = getValue('number', obj[0], 0);
        return [v, getValue('number', obj[1]) ?? v];
    }
    const val = getValue('number', obj, 0);
    return [val, val];
}
export function createGraphCurveValue(obj) {
    if (!Array.isArray(obj))
        return [0.0, 0.0];
    if (obj.length < 2)
        return [0.0, 0.0];
    return [getValue('number', obj[0], 0), getValue('number', obj[1], 0)];
}
export function createGraphPoint(arr) {
    return [
        getValue('bigint', arr[0], 0n),
        createGraphValue(arr[1]),
        createGraphCurveValue(arr[2]),
    ];
}
