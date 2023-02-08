import { z } from 'zod';

import { VERSION } from "./types.js";
import type * as types from "./types.js";

export const Pulse = z.coerce.bigint();
export const MeasureIdx = z.coerce.bigint();

/* Common objects */
function ByPulse<T extends z.ZodTypeAny>(schema: T) {
    return z.tuple([Pulse, schema]);
}

function ByMeasureIdx<T extends z.ZodTypeAny>(schema: T) {
    return z.tuple([MeasureIdx, schema]);
}

export const GraphValue = z.union([
    z.coerce.number().finite().transform<types.GraphValue>((v) => [v, v]),
    z.tuple([z.coerce.number().finite()]).transform<types.GraphValue>(([v]) => [v, v]),
    z.tuple([z.coerce.number().finite(), z.coerce.number().finite()]),
]);

export const GraphCurveValue = z.tuple([z.coerce.number().finite(), z.coerce.number().finite()]).default([0, 0]);

export const GraphPoint = z.union([
    z.tuple([Pulse, GraphValue]).transform<types.GraphPoint>(([y, v]) => [y, v, [0, 0]]),
    z.tuple([Pulse, GraphValue, GraphCurveValue])
]);

export const GraphSectionPoint = GraphPoint;

/* meta */
export const MetaInfo = z.object({
    title: z.string().default(""),
    title_translit: z.string().optional(),
    title_img_filename: z.string().optional(),
    artist: z.string().default(""),
    artist_translit: z.string().optional(),
    artist_img_filename: z.string().optional(),
    chart_author: z.string().default(""),
    difficulty: z.union([z.number().int(), z.string()]).default(0),
    level: z.coerce.number().int().default(1),
    disp_bpm: z.coerce.string().default("120"),
    std_bpm: z.coerce.number().finite().positive().optional(),
    jacket_filename: z.string().optional(),
    jacket_author: z.string().optional(),
    icon_filename: z.string().optional(),
    information: z.string().optional(),
});

/* beat */
export const TimeSig = z.tuple([z.coerce.number().positive().int(), z.coerce.number().positive().int()]);

export const BeatInfo = z.object({
    bpm: z.array(ByPulse(z.coerce.number().finite().positive())).default([[0n, 120]]),
    time_sig: z.array(ByMeasureIdx(TimeSig)).default([[0n, [4, 4]]]),
    scroll_speed: z.array(GraphPoint).default([[0n, [1.0, 1.0], [0.0, 0.0]]]),
});

/* gauge */
export const GaugeInfo = z.object({
    total: z.number().finite().nonnegative().default(0),
});

/* note */
export const ButtonNote = z.union([Pulse.transform<types.ButtonNote>((y) => [y, 0n]), z.tuple([Pulse, Pulse])]);
export const LaserSection = z.tuple([Pulse, GraphSectionPoint]);

export const NoteInfo = z.object({
    bt: z.tuple([z.array(ButtonNote), z.array(ButtonNote), z.array(ButtonNote), z.array(ButtonNote)]).default([[], [], [], []]),
    fx: z.tuple([z.array(ButtonNote), z.array(ButtonNote)]).default([[], []]),
    laser: z.tuple([z.array(LaserSection), z.array(LaserSection)]).default([[], []]),
});

/* audio */

/* camera */

/* bg */

/* editor */
export const EditorInfo = z.object({
    comment: z.array(ByPulse(z.coerce.string().default(""))).default([]),
});

/* compat */
export const KSHUnknownInfo = z.object({
    meta: z.record(z.coerce.string()).default({}),
    option: z.record(ByPulse(z.coerce.string())).default({}),
    line: z.array(ByPulse(z.coerce.string().default(""))).default([]),
});

export const CompatInfo = z.object({
    ksh_version: z.string().default(""),
    ksh_unknown: KSHUnknownInfo.default({}),
});

/* Top-level object */
/**
 * The zod schema for a KSON object.
 */
export const Kson = z.object({
    version: z.string().default(VERSION),
    meta: MetaInfo.default({}),
    beat: BeatInfo.default({}),
    gauge: GaugeInfo.default({}),
    note: NoteInfo.default({}),
    audio: z.any(),
    camera: z.any(),
    bg: z.any(),
    editor: EditorInfo.default({}),
    compat: CompatInfo.optional(),
    impl: z.any(),
});

export const Chart = Kson;