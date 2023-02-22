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
export const GraphPointList = toSortedList(GraphPoint);

export const GraphSectionPoint = GraphPoint;
export const GraphSectionPointList = toSortedList(GraphSectionPoint);

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
    scroll_speed: GraphPointList.default([[0n, [1.0, 1.0], [0.0, 0.0]]]),
});

/* gauge */
export const GaugeInfo = z.object({
    total: z.number().finite().nonnegative().default(0),
});

/* note */
export const ButtonNote = z.union([Pulse.transform<types.ButtonNote>((y) => [y, 0n]), z.tuple([Pulse, Pulse])]);
const ButtonNoteList = toSortedList(ButtonNote);

export const LaserSection = z.tuple([Pulse, GraphSectionPointList, z.coerce.number().finite().positive().default(1)]);
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

export const AudioEffectDef = z.object({
    type: z.string(),
    v: z.record(z.string()),
});

export const AudioEffectFXInfo = z.object({
    def: z.record(AudioEffectDef).default({}),
    param_change: z.record(z.record(toSortedList(ByPulse(z.string())))).default({}),
    // TODO: long_event
});

export const AudioEffectLaserInfo = z.object({
    def: z.record(AudioEffectDef).default({}),
    param_change: z.record(z.record(toSortedList(ByPulse(z.string())))).default({}),
    pulse_event: z.record(z.array(Pulse)).default({}),
    peaking_filter_delay: z.coerce.number().finite().default(0),
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
    manual: toSortedList(ByPulse(GraphSectionPointList)).default([]),
    keep: toSortedList(ByPulse(z.coerce.boolean())).default([[0n, false]]),
});

export const CamGraphs = z.object({
    zoom: GraphPointList.default([[0n, 0]]),
    shift_x: GraphPointList.default([[0n, 0]]),
    rotation_x: GraphPointList.default([[0n, 0]]),
    rotation_z: GraphPointList.default([[0n, 0]]),
    "rotation_z.highway": GraphPointList.default([[0n, 0]]),
    "rotation_z.jdgline": GraphPointList.default([[0n, 0]]),
    center_split: GraphPointList.default([[0n, 0]]),
});

export const CamPatternInvokeSpin = z.tuple([Pulse, z.union([z.literal(-1), z.literal(1)]), Pulse]);

export const CamPatternInvokeSwingValue = z.object({
    scale: z.coerce.number().finite().default(1.0),
    repeat: z.coerce.number().finite().nonnegative().int().default(1),
    decay_order: z.coerce.number().finite().nonnegative().int().default(0),
});
export const CamPatternInvokeSwing = z.tuple([Pulse, z.union([z.literal(-1), z.literal(1)]), Pulse, CamPatternInvokeSwingValue]);

export const CamPatternLaserInvokeList = z.object({
    spin: toSortedList(CamPatternInvokeSpin).default([]),
    half_spin: toSortedList(CamPatternInvokeSpin).default([]),
    swing: toSortedList(CamPatternInvokeSwing).default([]),
});

export const CamPatternLaserInfo = z.object({
    slam_event: CamPatternLaserInvokeList.default({}),
});

export const CamPatternInfo = z.object({
    laser: CamPatternLaserInfo.default({}),
});

export const CamInfo = z.object({
    body: CamGraphs.default({}),
    pattern: CamPatternInfo.optional(),
});

export const CameraInfo = z.object({
    tilt: TiltInfo.default({}),
    cam: CamInfo.default({}),
});

/* bg */
export const KSHBGInfo = z.object({
    filename: z.string().optional(),
});

export const KSHLayerRotationInfo = z.object({
    tilt: z.coerce.boolean().default(true),
    spin: z.coerce.boolean().default(true),
});

export const KSHLayerInfo = z.object({
    filename: z.string().optional(),
    duration: z.coerce.number().finite().default(0),
    rotation: KSHLayerRotationInfo.default({}),
});

export const KSHMovieInfo = z.object({
    filename: z.string().optional(),
    offset: z.coerce.number().finite().default(0),
});

export const KSHBGInfoPair = z.union([
    z.tuple([KSHBGInfo]).transform<[types.KSHBGInfo, types.KSHBGInfo]>(([v]: [types.KSHBGInfo]) => [v, {...v}]),
    z.tuple([KSHBGInfo, KSHBGInfo]),
]);

export const LegacyBGInfo = z.object({
    bg: KSHBGInfoPair.optional(),
    layer: KSHLayerInfo.optional(),
    movie: KSHMovieInfo.optional(),
});

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