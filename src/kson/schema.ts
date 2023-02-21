import { z } from 'zod';

import { VERSION } from "./types.js";
import type * as types from "./types.js";

import { isIterable } from "../util.js";
import { SortedList } from "../sorted-list.js";

function toSortedList<T extends z.ZodTypeAny>(schema: T) {
    return z.preprocess((v) => {
        if(Array.isArray(v)) return v;
        if(isIterable(v)) return [...v];
        return v;
    }, z.array(schema).transform((v) => new SortedList<z.output<T>>(v)));
}

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
    bpm: toSortedList(ByPulse(z.coerce.number().finite().positive())).default([[0n, 120]]),
    time_sig: toSortedList(ByMeasureIdx(TimeSig)).default([[0n, [4, 4]]]),
    scroll_speed: toSortedList(GraphPoint).default([[0n, [1.0, 1.0], [0.0, 0.0]]]),
});

/* gauge */
export const GaugeInfo = z.object({
    total: z.number().finite().nonnegative().default(0),
});

/* note */
export const ButtonNote = z.union([Pulse.transform<types.ButtonNote>((y) => [y, 0n]), z.tuple([Pulse, Pulse])]);
const ButtonNoteList = toSortedList(ButtonNote);

export const LaserSection = z.tuple([Pulse, toSortedList(GraphSectionPoint), z.coerce.number().finite().positive().default(1)]);
const LaserSectionList = toSortedList(LaserSection);

export const NoteInfo = z.object({
    bt: z.tuple([ButtonNoteList, ButtonNoteList, ButtonNoteList, ButtonNoteList]).default([[], [], [], []]),
    fx: z.tuple([ButtonNoteList, ButtonNoteList]).default([[], []]),
    laser: z.tuple([LaserSectionList, LaserSectionList]).default([[], []]),
});

/* audio */
export const BGMPreviewInfo = z.object({
    offset: z.coerce.number().finite().nonnegative().default(0),
    duration: z.coerce.number().finite().nonnegative().default(15000),
});

export const LegacyBGMInfo = z.object({
    fp_filenames: z.array(z.string()),
});

export const BGMInfo = z.object({
    filename: z.string().optional(),
    vol: z.coerce.number().finite().nonnegative().default(1.0),
    offset: z.coerce.number().finite().default(0),
    preview: BGMPreviewInfo.default({}),
    legacy: LegacyBGMInfo.optional(),
});

export const KeySoundInvokeFX = z.object({
    vol: z.coerce.number().finite().nonnegative().default(1.0),
});

export const KeySoundInvokeListFX = z.record(z.string(), z.tuple([
    toSortedList(ByPulse(KeySoundInvokeFX)),
    toSortedList(ByPulse(KeySoundInvokeFX)),
]));

export const KeySoundFXInfo = z.object({
    chip_event: KeySoundInvokeListFX.default({}),
});

export const KeySoundInvokeListLaser = z.object({
    slam_up: z.array(Pulse).default([]),
    slam_down: z.array(Pulse).default([]),
    slam_swing: z.array(Pulse).default([]),
    slam_mute: z.array(Pulse).default([]),
});

export const KeySoundLaserLegacyInfo = z.object({
    vol_auto: z.coerce.boolean().optional(),
});

export const KeySoundLaserInfo = z.object({
    vol: toSortedList(ByPulse(z.coerce.number().finite().nonnegative())).default([[0n, 0.5]]),
    slam_event: KeySoundInvokeListLaser.default({}),
    legacy: KeySoundLaserLegacyInfo.optional(),
});

export const KeySoundInfo = z.object({
    fx: KeySoundFXInfo.default({}),
    laser: KeySoundLaserInfo.default({}),
});

export const AudioEffectFXInfo = z.object({
    // TODO
});

export const AudioEffectLaserInfo = z.object({
    // TODO
});

export const AudioEffectInfo = z.object({
    fx: AudioEffectFXInfo.default({}),
    laser: AudioEffectLaserInfo.default({}),
});

export const AudioInfo = z.object({
    bgm: BGMInfo.default({}),
    key_sound: KeySoundInfo.optional(),
    audio_effect: AudioEffectInfo.optional(),
});

/* camera */
export const TiltInfo = z.object({
    scale: toSortedList(ByPulse(z.coerce.number().finite())).default([[0n, 1.0]]),
    manual: toSortedList(ByPulse(toSortedList(GraphSectionPoint))).default([]),
    keep: toSortedList(ByPulse(z.coerce.boolean())).default([[0n, false]]),
});

export const CamInfo = z.object({});

export const CameraInfo = z.object({
    tilt: TiltInfo.default({}),
    cam: CamInfo.default({}),
});

/* bg */
export const LegacyBGInfo = z.object({});

export const BGInfo = z.object({
    filename: z.coerce.string().optional(),
    offset: z.coerce.number().finite().default(0),
    legacy: LegacyBGInfo.optional(),
});

/* editor */
export const EditorInfo = z.object({
    comment: z.array(ByPulse(z.coerce.string().default(""))).default([]),
});

/* compat */
export const KSHUnknownInfo = z.object({
    meta: z.record(z.coerce.string()).default({}),
    option: z.record(z.array(ByPulse(z.coerce.string()))).default({}),
    line: toSortedList(ByPulse(z.coerce.string().default(""))).default([]),
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
    gauge: GaugeInfo.optional(),
    note: NoteInfo.default({}),
    audio: AudioInfo.optional(),
    camera: z.any(),
    bg: z.any(),
    editor: EditorInfo.optional(),
    compat: CompatInfo.optional(),
    impl: z.any(),
});

export const Chart = Kson;