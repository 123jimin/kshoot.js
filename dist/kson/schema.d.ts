import { z } from 'zod';
import * as Type from "./type.js";
export declare const Pulse: z.ZodBigInt;
export declare const MeasureIdx: z.ZodBigInt;
export declare const GraphValue: z.ZodUnion<[z.ZodEffects<z.ZodNumber, Type.GraphValue, number>, z.ZodEffects<z.ZodTuple<[z.ZodNumber], null>, Type.GraphValue, [number]>, z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>]>;
export declare const GraphCurveValue: z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
export declare const GraphPoint: z.ZodUnion<[z.ZodEffects<z.ZodTuple<[z.ZodBigInt, z.ZodUnion<[z.ZodEffects<z.ZodNumber, Type.GraphValue, number>, z.ZodEffects<z.ZodTuple<[z.ZodNumber], null>, Type.GraphValue, [number]>, z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>]>], null>, Type.GraphPoint, [bigint, number | [number, number] | [number]]>, z.ZodTuple<[z.ZodBigInt, z.ZodUnion<[z.ZodEffects<z.ZodNumber, Type.GraphValue, number>, z.ZodEffects<z.ZodTuple<[z.ZodNumber], null>, Type.GraphValue, [number]>, z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>]>, z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>], null>]>;
export declare const GraphSectionPoint: z.ZodUnion<[z.ZodEffects<z.ZodTuple<[z.ZodBigInt, z.ZodUnion<[z.ZodEffects<z.ZodNumber, Type.GraphValue, number>, z.ZodEffects<z.ZodTuple<[z.ZodNumber], null>, Type.GraphValue, [number]>, z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>]>], null>, Type.GraphPoint, [bigint, number | [number, number] | [number]]>, z.ZodTuple<[z.ZodBigInt, z.ZodUnion<[z.ZodEffects<z.ZodNumber, Type.GraphValue, number>, z.ZodEffects<z.ZodTuple<[z.ZodNumber], null>, Type.GraphValue, [number]>, z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>]>, z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>], null>]>;
export declare const MetaInfo: z.ZodObject<{
    title: z.ZodDefault<z.ZodString>;
    title_translit: z.ZodOptional<z.ZodString>;
    title_img_filename: z.ZodOptional<z.ZodString>;
    artist: z.ZodDefault<z.ZodString>;
    artist_translit: z.ZodOptional<z.ZodString>;
    artist_img_filename: z.ZodOptional<z.ZodString>;
    chart_author: z.ZodDefault<z.ZodString>;
    difficulty: z.ZodDefault<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
    level: z.ZodDefault<z.ZodNumber>;
    disp_bpm: z.ZodDefault<z.ZodString>;
    std_bpm: z.ZodOptional<z.ZodNumber>;
    jacket_filename: z.ZodOptional<z.ZodString>;
    jacket_author: z.ZodOptional<z.ZodString>;
    icon_filename: z.ZodOptional<z.ZodString>;
    information: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title_translit?: string | undefined;
    title_img_filename?: string | undefined;
    artist_translit?: string | undefined;
    artist_img_filename?: string | undefined;
    std_bpm?: number | undefined;
    jacket_filename?: string | undefined;
    jacket_author?: string | undefined;
    icon_filename?: string | undefined;
    information?: string | undefined;
    title: string;
    artist: string;
    chart_author: string;
    difficulty: string | number;
    level: number;
    disp_bpm: string;
}, {
    title?: string | undefined;
    title_translit?: string | undefined;
    title_img_filename?: string | undefined;
    artist?: string | undefined;
    artist_translit?: string | undefined;
    artist_img_filename?: string | undefined;
    chart_author?: string | undefined;
    difficulty?: string | number | undefined;
    level?: number | undefined;
    disp_bpm?: string | undefined;
    std_bpm?: number | undefined;
    jacket_filename?: string | undefined;
    jacket_author?: string | undefined;
    icon_filename?: string | undefined;
    information?: string | undefined;
}>;
export declare const TimeSig: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
export declare const BeatInfo: z.ZodObject<{
    bpm: z.ZodDefault<z.ZodArray<z.ZodTuple<[z.ZodBigInt, z.ZodNumber], null>, "many">>;
    time_sig: z.ZodDefault<z.ZodArray<z.ZodTuple<[z.ZodBigInt, z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>], null>, "many">>;
    scroll_speed: z.ZodDefault<z.ZodArray<z.ZodUnion<[z.ZodEffects<z.ZodTuple<[z.ZodBigInt, z.ZodUnion<[z.ZodEffects<z.ZodNumber, Type.GraphValue, number>, z.ZodEffects<z.ZodTuple<[z.ZodNumber], null>, Type.GraphValue, [number]>, z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>]>], null>, Type.GraphPoint, [bigint, number | [number, number] | [number]]>, z.ZodTuple<[z.ZodBigInt, z.ZodUnion<[z.ZodEffects<z.ZodNumber, Type.GraphValue, number>, z.ZodEffects<z.ZodTuple<[z.ZodNumber], null>, Type.GraphValue, [number]>, z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>]>, z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>], null>]>, "many">>;
}, "strip", z.ZodTypeAny, {
    bpm: [bigint, number][];
    time_sig: [bigint, [number, number]][];
    scroll_speed: (Type.GraphPoint | [bigint, [number, number] | Type.GraphValue, [number, number]])[];
}, {
    bpm?: [bigint, number][] | undefined;
    time_sig?: [bigint, [number, number]][] | undefined;
    scroll_speed?: ([bigint, number | [number, number] | [number]] | [bigint, number | [number, number] | [number], [number, number] | undefined])[] | undefined;
}>;
export declare const GaugeInfo: z.ZodObject<{
    total: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    total: number;
}, {
    total?: number | undefined;
}>;
export declare const ButtonNote: z.ZodUnion<[z.ZodEffects<z.ZodBigInt, Type.ButtonNote, bigint>, z.ZodTuple<[z.ZodBigInt, z.ZodBigInt], null>]>;
export declare const LaserSection: z.ZodTuple<[z.ZodBigInt, z.ZodUnion<[z.ZodEffects<z.ZodTuple<[z.ZodBigInt, z.ZodUnion<[z.ZodEffects<z.ZodNumber, Type.GraphValue, number>, z.ZodEffects<z.ZodTuple<[z.ZodNumber], null>, Type.GraphValue, [number]>, z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>]>], null>, Type.GraphPoint, [bigint, number | [number, number] | [number]]>, z.ZodTuple<[z.ZodBigInt, z.ZodUnion<[z.ZodEffects<z.ZodNumber, Type.GraphValue, number>, z.ZodEffects<z.ZodTuple<[z.ZodNumber], null>, Type.GraphValue, [number]>, z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>]>, z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>], null>]>], null>;
export declare const NoteInfo: z.ZodObject<{
    bt: z.ZodDefault<z.ZodTuple<[z.ZodArray<z.ZodUnion<[z.ZodEffects<z.ZodBigInt, Type.ButtonNote, bigint>, z.ZodTuple<[z.ZodBigInt, z.ZodBigInt], null>]>, "many">, z.ZodArray<z.ZodUnion<[z.ZodEffects<z.ZodBigInt, Type.ButtonNote, bigint>, z.ZodTuple<[z.ZodBigInt, z.ZodBigInt], null>]>, "many">, z.ZodArray<z.ZodUnion<[z.ZodEffects<z.ZodBigInt, Type.ButtonNote, bigint>, z.ZodTuple<[z.ZodBigInt, z.ZodBigInt], null>]>, "many">, z.ZodArray<z.ZodUnion<[z.ZodEffects<z.ZodBigInt, Type.ButtonNote, bigint>, z.ZodTuple<[z.ZodBigInt, z.ZodBigInt], null>]>, "many">], null>>;
    fx: z.ZodDefault<z.ZodTuple<[z.ZodArray<z.ZodUnion<[z.ZodEffects<z.ZodBigInt, Type.ButtonNote, bigint>, z.ZodTuple<[z.ZodBigInt, z.ZodBigInt], null>]>, "many">, z.ZodArray<z.ZodUnion<[z.ZodEffects<z.ZodBigInt, Type.ButtonNote, bigint>, z.ZodTuple<[z.ZodBigInt, z.ZodBigInt], null>]>, "many">], null>>;
    laser: z.ZodDefault<z.ZodTuple<[z.ZodArray<z.ZodTuple<[z.ZodBigInt, z.ZodUnion<[z.ZodEffects<z.ZodTuple<[z.ZodBigInt, z.ZodUnion<[z.ZodEffects<z.ZodNumber, Type.GraphValue, number>, z.ZodEffects<z.ZodTuple<[z.ZodNumber], null>, Type.GraphValue, [number]>, z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>]>], null>, Type.GraphPoint, [bigint, number | [number, number] | [number]]>, z.ZodTuple<[z.ZodBigInt, z.ZodUnion<[z.ZodEffects<z.ZodNumber, Type.GraphValue, number>, z.ZodEffects<z.ZodTuple<[z.ZodNumber], null>, Type.GraphValue, [number]>, z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>]>, z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>], null>]>], null>, "many">, z.ZodArray<z.ZodTuple<[z.ZodBigInt, z.ZodUnion<[z.ZodEffects<z.ZodTuple<[z.ZodBigInt, z.ZodUnion<[z.ZodEffects<z.ZodNumber, Type.GraphValue, number>, z.ZodEffects<z.ZodTuple<[z.ZodNumber], null>, Type.GraphValue, [number]>, z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>]>], null>, Type.GraphPoint, [bigint, number | [number, number] | [number]]>, z.ZodTuple<[z.ZodBigInt, z.ZodUnion<[z.ZodEffects<z.ZodNumber, Type.GraphValue, number>, z.ZodEffects<z.ZodTuple<[z.ZodNumber], null>, Type.GraphValue, [number]>, z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>]>, z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>], null>]>], null>, "many">], null>>;
}, "strip", z.ZodTypeAny, {
    bt: [(Type.ButtonNote | [bigint, bigint])[], (Type.ButtonNote | [bigint, bigint])[], (Type.ButtonNote | [bigint, bigint])[], (Type.ButtonNote | [bigint, bigint])[]];
    fx: [(Type.ButtonNote | [bigint, bigint])[], (Type.ButtonNote | [bigint, bigint])[]];
    laser: [[bigint, Type.GraphPoint | [bigint, [number, number] | Type.GraphValue, [number, number]]][], [bigint, Type.GraphPoint | [bigint, [number, number] | Type.GraphValue, [number, number]]][]];
}, {
    bt?: [(bigint | [bigint, bigint])[], (bigint | [bigint, bigint])[], (bigint | [bigint, bigint])[], (bigint | [bigint, bigint])[]] | undefined;
    fx?: [(bigint | [bigint, bigint])[], (bigint | [bigint, bigint])[]] | undefined;
    laser?: [[bigint, [bigint, number | [number, number] | [number]] | [bigint, number | [number, number] | [number], [number, number] | undefined]][], [bigint, [bigint, number | [number, number] | [number]] | [bigint, number | [number, number] | [number], [number, number] | undefined]][]] | undefined;
}>;
export declare const EditorInfo: z.ZodObject<{
    comment: z.ZodDefault<z.ZodArray<z.ZodTuple<[z.ZodBigInt, z.ZodDefault<z.ZodString>], null>, "many">>;
}, "strip", z.ZodTypeAny, {
    comment: [bigint, string][];
}, {
    comment?: [bigint, string | undefined][] | undefined;
}>;
export declare const KSHUnknownInfo: z.ZodObject<{
    meta: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    option: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodTuple<[z.ZodBigInt, z.ZodString], null>>>;
    line: z.ZodDefault<z.ZodArray<z.ZodTuple<[z.ZodBigInt, z.ZodDefault<z.ZodString>], null>, "many">>;
}, "strip", z.ZodTypeAny, {
    meta: Record<string, string>;
    option: Record<string, [bigint, string]>;
    line: [bigint, string][];
}, {
    meta?: Record<string, string> | undefined;
    option?: Record<string, [bigint, string]> | undefined;
    line?: [bigint, string | undefined][] | undefined;
}>;
export declare const CompatInfo: z.ZodObject<{
    ksh_version: z.ZodDefault<z.ZodString>;
    ksh_unknown: z.ZodDefault<z.ZodObject<{
        meta: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
        option: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodTuple<[z.ZodBigInt, z.ZodString], null>>>;
        line: z.ZodDefault<z.ZodArray<z.ZodTuple<[z.ZodBigInt, z.ZodDefault<z.ZodString>], null>, "many">>;
    }, "strip", z.ZodTypeAny, {
        meta: Record<string, string>;
        option: Record<string, [bigint, string]>;
        line: [bigint, string][];
    }, {
        meta?: Record<string, string> | undefined;
        option?: Record<string, [bigint, string]> | undefined;
        line?: [bigint, string | undefined][] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    ksh_version: string;
    ksh_unknown: {
        meta: Record<string, string>;
        option: Record<string, [bigint, string]>;
        line: [bigint, string][];
    };
}, {
    ksh_version?: string | undefined;
    ksh_unknown?: {
        meta?: Record<string, string> | undefined;
        option?: Record<string, [bigint, string]> | undefined;
        line?: [bigint, string | undefined][] | undefined;
    } | undefined;
}>;
/**
 * The zod schema for a KSON object.
 */
export declare const Kson: z.ZodObject<{
    version: z.ZodDefault<z.ZodString>;
    meta: z.ZodDefault<z.ZodObject<{
        title: z.ZodDefault<z.ZodString>;
        title_translit: z.ZodOptional<z.ZodString>;
        title_img_filename: z.ZodOptional<z.ZodString>;
        artist: z.ZodDefault<z.ZodString>;
        artist_translit: z.ZodOptional<z.ZodString>;
        artist_img_filename: z.ZodOptional<z.ZodString>;
        chart_author: z.ZodDefault<z.ZodString>;
        difficulty: z.ZodDefault<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
        level: z.ZodDefault<z.ZodNumber>;
        disp_bpm: z.ZodDefault<z.ZodString>;
        std_bpm: z.ZodOptional<z.ZodNumber>;
        jacket_filename: z.ZodOptional<z.ZodString>;
        jacket_author: z.ZodOptional<z.ZodString>;
        icon_filename: z.ZodOptional<z.ZodString>;
        information: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title_translit?: string | undefined;
        title_img_filename?: string | undefined;
        artist_translit?: string | undefined;
        artist_img_filename?: string | undefined;
        std_bpm?: number | undefined;
        jacket_filename?: string | undefined;
        jacket_author?: string | undefined;
        icon_filename?: string | undefined;
        information?: string | undefined;
        title: string;
        artist: string;
        chart_author: string;
        difficulty: string | number;
        level: number;
        disp_bpm: string;
    }, {
        title?: string | undefined;
        title_translit?: string | undefined;
        title_img_filename?: string | undefined;
        artist?: string | undefined;
        artist_translit?: string | undefined;
        artist_img_filename?: string | undefined;
        chart_author?: string | undefined;
        difficulty?: string | number | undefined;
        level?: number | undefined;
        disp_bpm?: string | undefined;
        std_bpm?: number | undefined;
        jacket_filename?: string | undefined;
        jacket_author?: string | undefined;
        icon_filename?: string | undefined;
        information?: string | undefined;
    }>>;
    beat: z.ZodDefault<z.ZodObject<{
        bpm: z.ZodDefault<z.ZodArray<z.ZodTuple<[z.ZodBigInt, z.ZodNumber], null>, "many">>;
        time_sig: z.ZodDefault<z.ZodArray<z.ZodTuple<[z.ZodBigInt, z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>], null>, "many">>;
        scroll_speed: z.ZodDefault<z.ZodArray<z.ZodUnion<[z.ZodEffects<z.ZodTuple<[z.ZodBigInt, z.ZodUnion<[z.ZodEffects<z.ZodNumber, Type.GraphValue, number>, z.ZodEffects<z.ZodTuple<[z.ZodNumber], null>, Type.GraphValue, [number]>, z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>]>], null>, Type.GraphPoint, [bigint, number | [number, number] | [number]]>, z.ZodTuple<[z.ZodBigInt, z.ZodUnion<[z.ZodEffects<z.ZodNumber, Type.GraphValue, number>, z.ZodEffects<z.ZodTuple<[z.ZodNumber], null>, Type.GraphValue, [number]>, z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>]>, z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>], null>]>, "many">>;
    }, "strip", z.ZodTypeAny, {
        bpm: [bigint, number][];
        time_sig: [bigint, [number, number]][];
        scroll_speed: (Type.GraphPoint | [bigint, [number, number] | Type.GraphValue, [number, number]])[];
    }, {
        bpm?: [bigint, number][] | undefined;
        time_sig?: [bigint, [number, number]][] | undefined;
        scroll_speed?: ([bigint, number | [number, number] | [number]] | [bigint, number | [number, number] | [number], [number, number] | undefined])[] | undefined;
    }>>;
    gauge: z.ZodDefault<z.ZodObject<{
        total: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        total: number;
    }, {
        total?: number | undefined;
    }>>;
    note: z.ZodDefault<z.ZodObject<{
        bt: z.ZodDefault<z.ZodTuple<[z.ZodArray<z.ZodUnion<[z.ZodEffects<z.ZodBigInt, Type.ButtonNote, bigint>, z.ZodTuple<[z.ZodBigInt, z.ZodBigInt], null>]>, "many">, z.ZodArray<z.ZodUnion<[z.ZodEffects<z.ZodBigInt, Type.ButtonNote, bigint>, z.ZodTuple<[z.ZodBigInt, z.ZodBigInt], null>]>, "many">, z.ZodArray<z.ZodUnion<[z.ZodEffects<z.ZodBigInt, Type.ButtonNote, bigint>, z.ZodTuple<[z.ZodBigInt, z.ZodBigInt], null>]>, "many">, z.ZodArray<z.ZodUnion<[z.ZodEffects<z.ZodBigInt, Type.ButtonNote, bigint>, z.ZodTuple<[z.ZodBigInt, z.ZodBigInt], null>]>, "many">], null>>;
        fx: z.ZodDefault<z.ZodTuple<[z.ZodArray<z.ZodUnion<[z.ZodEffects<z.ZodBigInt, Type.ButtonNote, bigint>, z.ZodTuple<[z.ZodBigInt, z.ZodBigInt], null>]>, "many">, z.ZodArray<z.ZodUnion<[z.ZodEffects<z.ZodBigInt, Type.ButtonNote, bigint>, z.ZodTuple<[z.ZodBigInt, z.ZodBigInt], null>]>, "many">], null>>;
        laser: z.ZodDefault<z.ZodTuple<[z.ZodArray<z.ZodTuple<[z.ZodBigInt, z.ZodUnion<[z.ZodEffects<z.ZodTuple<[z.ZodBigInt, z.ZodUnion<[z.ZodEffects<z.ZodNumber, Type.GraphValue, number>, z.ZodEffects<z.ZodTuple<[z.ZodNumber], null>, Type.GraphValue, [number]>, z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>]>], null>, Type.GraphPoint, [bigint, number | [number, number] | [number]]>, z.ZodTuple<[z.ZodBigInt, z.ZodUnion<[z.ZodEffects<z.ZodNumber, Type.GraphValue, number>, z.ZodEffects<z.ZodTuple<[z.ZodNumber], null>, Type.GraphValue, [number]>, z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>]>, z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>], null>]>], null>, "many">, z.ZodArray<z.ZodTuple<[z.ZodBigInt, z.ZodUnion<[z.ZodEffects<z.ZodTuple<[z.ZodBigInt, z.ZodUnion<[z.ZodEffects<z.ZodNumber, Type.GraphValue, number>, z.ZodEffects<z.ZodTuple<[z.ZodNumber], null>, Type.GraphValue, [number]>, z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>]>], null>, Type.GraphPoint, [bigint, number | [number, number] | [number]]>, z.ZodTuple<[z.ZodBigInt, z.ZodUnion<[z.ZodEffects<z.ZodNumber, Type.GraphValue, number>, z.ZodEffects<z.ZodTuple<[z.ZodNumber], null>, Type.GraphValue, [number]>, z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>]>, z.ZodDefault<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>], null>]>], null>, "many">], null>>;
    }, "strip", z.ZodTypeAny, {
        bt: [(Type.ButtonNote | [bigint, bigint])[], (Type.ButtonNote | [bigint, bigint])[], (Type.ButtonNote | [bigint, bigint])[], (Type.ButtonNote | [bigint, bigint])[]];
        fx: [(Type.ButtonNote | [bigint, bigint])[], (Type.ButtonNote | [bigint, bigint])[]];
        laser: [[bigint, Type.GraphPoint | [bigint, [number, number] | Type.GraphValue, [number, number]]][], [bigint, Type.GraphPoint | [bigint, [number, number] | Type.GraphValue, [number, number]]][]];
    }, {
        bt?: [(bigint | [bigint, bigint])[], (bigint | [bigint, bigint])[], (bigint | [bigint, bigint])[], (bigint | [bigint, bigint])[]] | undefined;
        fx?: [(bigint | [bigint, bigint])[], (bigint | [bigint, bigint])[]] | undefined;
        laser?: [[bigint, [bigint, number | [number, number] | [number]] | [bigint, number | [number, number] | [number], [number, number] | undefined]][], [bigint, [bigint, number | [number, number] | [number]] | [bigint, number | [number, number] | [number], [number, number] | undefined]][]] | undefined;
    }>>;
    audio: z.ZodAny;
    camera: z.ZodAny;
    bg: z.ZodAny;
    editor: z.ZodDefault<z.ZodObject<{
        comment: z.ZodDefault<z.ZodArray<z.ZodTuple<[z.ZodBigInt, z.ZodDefault<z.ZodString>], null>, "many">>;
    }, "strip", z.ZodTypeAny, {
        comment: [bigint, string][];
    }, {
        comment?: [bigint, string | undefined][] | undefined;
    }>>;
    compat: z.ZodOptional<z.ZodObject<{
        ksh_version: z.ZodDefault<z.ZodString>;
        ksh_unknown: z.ZodDefault<z.ZodObject<{
            meta: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
            option: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodTuple<[z.ZodBigInt, z.ZodString], null>>>;
            line: z.ZodDefault<z.ZodArray<z.ZodTuple<[z.ZodBigInt, z.ZodDefault<z.ZodString>], null>, "many">>;
        }, "strip", z.ZodTypeAny, {
            meta: Record<string, string>;
            option: Record<string, [bigint, string]>;
            line: [bigint, string][];
        }, {
            meta?: Record<string, string> | undefined;
            option?: Record<string, [bigint, string]> | undefined;
            line?: [bigint, string | undefined][] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        ksh_version: string;
        ksh_unknown: {
            meta: Record<string, string>;
            option: Record<string, [bigint, string]>;
            line: [bigint, string][];
        };
    }, {
        ksh_version?: string | undefined;
        ksh_unknown?: {
            meta?: Record<string, string> | undefined;
            option?: Record<string, [bigint, string]> | undefined;
            line?: [bigint, string | undefined][] | undefined;
        } | undefined;
    }>>;
    impl: z.ZodAny;
}, "strip", z.ZodTypeAny, {
    audio?: any;
    camera?: any;
    bg?: any;
    compat?: {
        ksh_version: string;
        ksh_unknown: {
            meta: Record<string, string>;
            option: Record<string, [bigint, string]>;
            line: [bigint, string][];
        };
    } | undefined;
    impl?: any;
    meta: {
        title_translit?: string | undefined;
        title_img_filename?: string | undefined;
        artist_translit?: string | undefined;
        artist_img_filename?: string | undefined;
        std_bpm?: number | undefined;
        jacket_filename?: string | undefined;
        jacket_author?: string | undefined;
        icon_filename?: string | undefined;
        information?: string | undefined;
        title: string;
        artist: string;
        chart_author: string;
        difficulty: string | number;
        level: number;
        disp_bpm: string;
    };
    beat: {
        bpm: [bigint, number][];
        time_sig: [bigint, [number, number]][];
        scroll_speed: (Type.GraphPoint | [bigint, [number, number] | Type.GraphValue, [number, number]])[];
    };
    version: string;
    gauge: {
        total: number;
    };
    note: {
        bt: [(Type.ButtonNote | [bigint, bigint])[], (Type.ButtonNote | [bigint, bigint])[], (Type.ButtonNote | [bigint, bigint])[], (Type.ButtonNote | [bigint, bigint])[]];
        fx: [(Type.ButtonNote | [bigint, bigint])[], (Type.ButtonNote | [bigint, bigint])[]];
        laser: [[bigint, Type.GraphPoint | [bigint, [number, number] | Type.GraphValue, [number, number]]][], [bigint, Type.GraphPoint | [bigint, [number, number] | Type.GraphValue, [number, number]]][]];
    };
    editor: {
        comment: [bigint, string][];
    };
}, {
    audio?: any;
    meta?: {
        title?: string | undefined;
        title_translit?: string | undefined;
        title_img_filename?: string | undefined;
        artist?: string | undefined;
        artist_translit?: string | undefined;
        artist_img_filename?: string | undefined;
        chart_author?: string | undefined;
        difficulty?: string | number | undefined;
        level?: number | undefined;
        disp_bpm?: string | undefined;
        std_bpm?: number | undefined;
        jacket_filename?: string | undefined;
        jacket_author?: string | undefined;
        icon_filename?: string | undefined;
        information?: string | undefined;
    } | undefined;
    beat?: {
        bpm?: [bigint, number][] | undefined;
        time_sig?: [bigint, [number, number]][] | undefined;
        scroll_speed?: ([bigint, number | [number, number] | [number]] | [bigint, number | [number, number] | [number], [number, number] | undefined])[] | undefined;
    } | undefined;
    version?: string | undefined;
    gauge?: {
        total?: number | undefined;
    } | undefined;
    note?: {
        bt?: [(bigint | [bigint, bigint])[], (bigint | [bigint, bigint])[], (bigint | [bigint, bigint])[], (bigint | [bigint, bigint])[]] | undefined;
        fx?: [(bigint | [bigint, bigint])[], (bigint | [bigint, bigint])[]] | undefined;
        laser?: [[bigint, [bigint, number | [number, number] | [number]] | [bigint, number | [number, number] | [number], [number, number] | undefined]][], [bigint, [bigint, number | [number, number] | [number]] | [bigint, number | [number, number] | [number], [number, number] | undefined]][]] | undefined;
    } | undefined;
    camera?: any;
    bg?: any;
    editor?: {
        comment?: [bigint, string | undefined][] | undefined;
    } | undefined;
    compat?: {
        ksh_version?: string | undefined;
        ksh_unknown?: {
            meta?: Record<string, string> | undefined;
            option?: Record<string, [bigint, string]> | undefined;
            line?: [bigint, string | undefined][] | undefined;
        } | undefined;
    } | undefined;
    impl?: any;
}>;
