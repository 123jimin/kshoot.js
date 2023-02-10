/* eslint-disable @typescript-eslint/no-empty-interface */

/** The latest version supported by this module */
export const VERSION = "0.6.0";
export const PULSES_PER_WHOLE = 960n;

export type Pulse = bigint;
export type MeasureIdx = bigint;

/* Top-level object */

/**
 * The type representing a KSON object; this type is a strict subset of what the spec specifies.
 */
export interface Kson {
    version: string;
    meta: MetaInfo;
    beat: BeatInfo;
    gauge?: GaugeInfo;
    note: NoteInfo;
    audio?: AudioInfo;
    camera?: CameraInfo;
    bg?: BGInfo;
    editor?: EditorInfo;
    compat?: CompatInfo;
    impl?: unknown;
}

/** Alias for {@link Kson|`kson.Kson`} */
export type Chart = Kson;

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

/* beat */
export interface BeatInfo {
    bpm: Iterable<ByPulse<number>>;
    time_sig: Iterable<ByMeasureIdx<TimeSig>>;
    scroll_speed: Iterable<GraphPoint>;
}

export type TimeSig = [ numerator: number, denominator: number ];

/* gauge */
export interface GaugeInfo {
    total: number;
}

/* note */
export interface NoteInfo {
    bt: [ButtonNotes, ButtonNotes, ButtonNotes, ButtonNotes];
    fx: [ButtonNotes, ButtonNotes];
    laser: [LaserSections, LaserSections];
}

export type ButtonNote = [ y: Pulse, length: Pulse ];
export type ButtonNotes = Iterable<ButtonNote>;

export type LaserSection = [ y: Pulse, v: Iterable<GraphSectionPoint>, w: number ];
export type LaserSections = Iterable<LaserSection>;

/* audio */
export interface AudioInfo {
    bgm: BGMInfo;
    key_sound?: KeySoundInfo;
    audio_effect?: AudioEffectInfo;
}

export interface BGMInfo {
    filename?: string;
    vol: number;
    offset: number;
    preview: BGMPreviewInfo;
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
    [filename: string]: [(Pulse|ByPulse<KeySoundInvokeFX>)[], (Pulse|ByPulse<KeySoundInvokeFX>)[]];
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
    comment: Iterable<ByPulse<string>>;
}

/* compat */
export interface CompatInfo {
    ksh_version: string;
    ksh_unknown: KSHUnknownInfo;
}

export interface KSHUnknownInfo {
    meta: {[name: string]: string};
    option: {[name: string]: Iterable<ByPulse<string>>};
    line: Iterable<ByPulse<string>>;
}

/* Common objects */
export type ByPulse<T> = [ y: Pulse, v: T ];
export type ByMeasureIdx<T> = [ idx: MeasureIdx, v: T ];

export type GraphValue = [ v: number, vf: number ];
export type GraphCurveValue = [ a: number, b: number ];
export type GraphPoint = [ y: Pulse, v: GraphValue, curve: GraphCurveValue ];
export type GraphSectionPoint = [ ry: Pulse, v: GraphValue, curve: GraphCurveValue ];