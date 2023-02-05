// Note that this definition is semantically compatible with KSON specification,
// but technically the Kson type is a strict subset of the spec.
// Therefore, these types can't be used to create a JSON schema.

function getValue(type: 'string', value: unknown): string;
function getValue(type: 'string', value: unknown, empty: string): string;
function getValue(type: 'number', value: unknown): number;
function getValue(type: 'number', value: unknown, empty: number): number;
function getValue(type: 'integer', value: unknown): number;
function getValue(type: 'integer', value: unknown, empty: number): number;
function getValue(type: 'bigint', value: unknown): bigint;
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
        case 'integer':
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
        case 'bigint':
            let bigint_value = BigInt(empty ?? 0);

            try {
                if(typeof value === 'bigint') {
                    return value;
                }

                bigint_value = BigInt(value);
            } catch(_) {}

            return bigint_value;
    }
}

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

export type Pulse = bigint;
export type MeasureIdx = bigint;

/* Top-level object */
export interface Kson {
    version: string;
    meta: MetaInfo;
    beat: BeatInfo;
    gauge?: GaugeInfo;
    note?: NoteInfo;
    audio?: AudioInfo;
    camera?: CameraInfo;
    bg?: BGInfo;
    editor?: EditorInfo;
    compat?: CompatInfo;
    impl?: {};
}

/* meta */
export interface MetaInfo {
    title: string;
    title_translit?: string;
    title_img_filename?: string;
    artist: string;
    artist_translit?: string;
    artist_img_filename?: string;
    chart_author: string;
    difficulty: number|string;
    level: number;
    disp_bpm: string;
    std_bpm?: number;
    jacket_filename?: string;
    jacket_author?: string;
    icon_filename?: string;
    information?: string;
}

export function createMetaInfo(obj: Readonly<{[key: string]: unknown}> = {}): MetaInfo {
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

/* beat */
export interface BeatInfo {
    bpm: ByPulse<number>[];
    time_sig: ByMeasureIdx<TimeSig>[];
    scroll_speed: GraphPoint[];
}

export function createBeatInfo(obj: Readonly<{[key: string]: unknown}> = {}): BeatInfo {
    let bpm_arr: ByPulse<number>[] = [[0n, 120]];
    let time_sig_arr: ByMeasureIdx<TimeSig>[] = [[0n, [4, 4]]];
    let scroll_speed_arr: GraphPoint[] = [createGraphPoint([0n, 1.0])];

    return {
        bpm: bpm_arr,
        time_sig: time_sig_arr,
        scroll_speed: scroll_speed_arr,
    }
}

export type TimeSig = [ numerator: number, denominator: number ];

/* gauge */
export interface GaugeInfo {
    total: number;
}

/* note */
export interface NoteInfo {
    bt?: [ButtonNote, ButtonNote, ButtonNote, ButtonNote][];
    fx?: [ButtonNote, ButtonNote][];
    laser: [LaserSection, LaserSection][];
}

export type ButtonNote = [ y: Pulse, length: Pulse ];

export type LaserSection = [ y: Pulse, v: GraphSectionPoint ];

/* audio */
export interface AudioInfo {
    bgm?: BGMInfo;
    key_sound?: KeySoundInfo;
    audio_effect?: AudioEffectInfo;
}

export interface BGMInfo {
    filename?: string;
    vol: number;
    offset: number;
    preview?: BGMPreviewInfo;
    legacy?: LegacyBGMInfo;
}

export interface BGMPreviewInfo {
    offset: number;
    duration: number;
}

export interface LegacyBGMInfo {}

export interface KeySoundInfo {
    fx?: KeySoundFXInfo;
    laser?: KeySoundLaserInfo;
}

export interface KeySoundFXInfo {
    chip_event: KeySoundInvokeListFX;
}

export interface KeySoundInvokeListFX {
    [filename: string]: [Pulse|ByPulse<KeySoundInvokeFX>, Pulse|ByPulse<KeySoundInvokeFX>][];
}

export interface KeySoundInvokeFX {
    vol: number;
}

export interface KeySoundLaserInfo {}

export interface KeySoundInvokeListLaser {}

export interface KeySoundLaserLegacyInfo {}

export interface AudioEffectInfo {}

export interface AudioEffectFXInfo {}

/* camera */
export interface CameraInfo {}

/* bg */
export interface BGInfo {}

/* editor */
export interface EditorInfo {
    comment?: ByPulse<string>[];
}

/* compat */
export interface CompatInfo {
    ksh_version?: string;
    ksh_unknown?: KSHUnknownInfo;
}

export interface KSHUnknownInfo {
    meta: {[name: string]: string};
    option: {[name: string]: ByPulse<string>};
    line: ByPulse<string>[];
}

/* Common objects */
export type ByPulse<T> = [ y: Pulse, v: T ];
export type ByMeasureIdx<T> = [ idx: MeasureIdx, v: T ];

export type GraphValue = [ v: number, vf: number ];
export function createGraphValue(obj: unknown): GraphValue {
    if(Array.isArray(obj) && obj.length >= 1) {
        const v = getValue('number', obj[0], 0);
        return [v, getValue('number', obj[1]) ?? v];
    }

    const val = getValue('number', obj, 0);
    return [val, val];
}

export type GraphCurveValue = [ a: number, b: number ];
export function createGraphCurveValue(obj: unknown): GraphCurveValue {
    if(!Array.isArray(obj)) return [ 0.0, 0.0 ];
    if(obj.length < 2) return [0.0, 0.0];
    return [ getValue('number', obj[0], 0), getValue('number', obj[1], 0) ];
}

export type GraphPoint = [ y: Pulse, v: GraphValue, curve: GraphCurveValue ];
export function createGraphPoint (arr: Array<unknown>): GraphPoint {
    return [
        getValue('bigint', arr[0], 0n),
        createGraphValue(arr[1]),
        createGraphCurveValue(arr[2]),
    ]
}

export type GraphSectionPoint = [ ry: Pulse, v: GraphValue, curve: GraphCurveValue ];