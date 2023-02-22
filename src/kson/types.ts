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

export interface LegacyBGMInfo {
    fp_filenames: string[];
}

export interface KeySoundInfo {
    fx?: KeySoundFXInfo;
    laser?: KeySoundLaserInfo;
}

export interface KeySoundFXInfo {
    chip_event: KeySoundInvokeListFX;
}

export interface KeySoundInvokeListFX {
    [filename: string]: [Iterable<ByPulse<KeySoundInvokeFX>>, Iterable<ByPulse<KeySoundInvokeFX>>];
}

export interface KeySoundInvokeFX {
    vol: number;
}

export interface KeySoundLaserInfo {
    vol: Iterable<ByPulse<number>>;
    slam_event: KeySoundInvokeListLaser;
    legacy?: KeySoundLaserLegacyInfo;
}

export interface KeySoundInvokeListLaser {
    slam_up: Iterable<Pulse>;
    slam_down: Iterable<Pulse>;
    slam_swing: Iterable<Pulse>;
    slam_mute: Iterable<Pulse>;
}

export interface KeySoundLaserLegacyInfo {
    vol_auto?: boolean;
}

export interface AudioEffectInfo {
    fx: AudioEffectFXInfo;
    laser: AudioEffectLaserInfo;
}

export interface AudioEffectFXInfo {
    def: Record<string, AudioEffectDef>;
    param_change: Record<string, Record<string, Iterable<ByPulse<string>>>>;
    // TODO: long_event
}

export interface AudioEffectLaserInfo {
    def: Record<string, AudioEffectDef>;
    param_change: Record<string, Record<string, Iterable<ByPulse<string>>>>;
    pulse_event: Record<string, Iterable<Pulse>>;
    peaking_filter_delay: number;
}

export interface AudioEffectDef {
    type: string;
    v: Record<string, string>;
}

/* camera */
export interface CameraInfo {
    tilt: TiltInfo;
    cam: CamInfo;
}

export interface TiltInfo {
    scale: Iterable<ByPulse<number>>;
    manual: Iterable<ByPulse<Iterable<GraphSectionPoint>>>;
    keep: Iterable<ByPulse<boolean>>;
}

export interface CamInfo {
    body: CamGraphs;
    pattern?: CamPatternInfo;
}

export interface CamGraphs { 
    zoom: Iterable<GraphPoint>;
    shift_x: Iterable<GraphPoint>;
    rotation_x: Iterable<GraphPoint>;
    rotation_z: Iterable<GraphPoint>;
    "rotation_z.highway": Iterable<GraphPoint>;
    "rotation_z.jdgline": Iterable<GraphPoint>;
    center_split: Iterable<GraphPoint>;
}

export interface CamPatternInfo {
    laser: CamPatternLaserInfo;
}

export interface CamPatternLaserInfo {
    slam_event: CamPatternLaserInvokeList;
}

export interface CamPatternLaserInvokeList {
    spin: Iterable<CamPatternInvokeSpin>;
    half_spin: Iterable<CamPatternInvokeSpin>;
    swing: Iterable<CamPatternInvokeSwing>;
}

export type CamPatternInvokeSpin = [y: Pulse, direction: -1|1, length: Pulse];
export type CamPatternInvokeSwing = [y: Pulse, direction: -1|1, length: Pulse, v: CamPatternInvokeSwingValue];
export interface CamPatternInvokeSwingValue {
    scale: number;
    repeat: number;
    decay_order: number;
}

/* bg */
export interface BGInfo {
    filename?: string;
    offset: number;
    legacy?: LegacyBGInfo;
}

export interface LegacyBGInfo {
    bg?: [KSHBGInfo, KSHBGInfo];
    layer?: KSHLayerInfo;
    movie?: KSHMovieInfo;
}

export interface KSHBGInfo {
    filename?: string;
}

export interface KSHLayerInfo {
    filename?: string;
    duration: number;
    rotation: KSHLayerRotationInfo;
}

export interface KSHLayerRotationInfo {
    tilt: boolean;
    spin: boolean;
}

export interface KSHMovieInfo {
    filename?: string;
    offset: number;
}

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
    option: {[name: string]: ByPulse<string>[]};
    line: ByPulse<string>[];
}

/* Common objects */
export type ByPulse<T> = [ y: Pulse, v: T ];
export type ByMeasureIdx<T> = [ idx: MeasureIdx, v: T ];

export type GraphValue = [ v: number, vf: number ];
export type GraphCurveValue = [ a: number, b: number ];
export type GraphPoint = [ y: Pulse, v: GraphValue, curve: GraphCurveValue ];
export type GraphSectionPoint = [ ry: Pulse, v: GraphValue, curve: GraphCurveValue ];