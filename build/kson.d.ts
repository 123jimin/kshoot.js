export type Pulse = bigint;
export type MeasureIdx = bigint;
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
export interface MetaInfo {
    title: string;
    title_translit?: string;
    title_img_filename?: string;
    artist: string;
    artist_translit?: string;
    artist_img_filename?: string;
    chart_author: string;
    difficulty: number | string;
    level: number;
    disp_bpm: string;
    std_bpm?: number;
    jacket_filename?: string;
    jacket_author?: string;
    icon_filename?: string;
    information?: string;
}
export declare function createMetaInfo(obj?: Readonly<{
    [key: string]: unknown;
}>): MetaInfo;
export interface BeatInfo {
    bpm: ByPulse<number>[];
    time_sig: ByMeasureIdx<TimeSig>[];
    scroll_speed: GraphPoint[];
}
export declare function createBeatInfo(obj?: Readonly<{
    [key: string]: unknown;
}>): BeatInfo;
export type TimeSig = [numerator: number, denominator: number];
export interface GaugeInfo {
    total: number;
}
export interface NoteInfo {
    bt?: [ButtonNote, ButtonNote, ButtonNote, ButtonNote][];
    fx?: [ButtonNote, ButtonNote][];
    laser: [LaserSection, LaserSection][];
}
export type ButtonNote = [y: Pulse, length: Pulse];
export type LaserSection = [y: Pulse, v: GraphSectionPoint];
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
export interface LegacyBGMInfo {
}
export interface KeySoundInfo {
    fx?: KeySoundFXInfo;
    laser?: KeySoundLaserInfo;
}
export interface KeySoundFXInfo {
    chip_event: KeySoundInvokeListFX;
}
export interface KeySoundInvokeListFX {
    [filename: string]: [Pulse | ByPulse<KeySoundInvokeFX>, Pulse | ByPulse<KeySoundInvokeFX>][];
}
export interface KeySoundInvokeFX {
    vol: number;
}
export interface KeySoundLaserInfo {
}
export interface KeySoundInvokeListLaser {
}
export interface KeySoundLaserLegacyInfo {
}
export interface AudioEffectInfo {
}
export interface AudioEffectFXInfo {
}
export interface CameraInfo {
}
export interface BGInfo {
}
export interface EditorInfo {
    comment?: ByPulse<string>[];
}
export interface CompatInfo {
    ksh_version?: string;
    ksh_unknown?: KSHUnknownInfo;
}
export interface KSHUnknownInfo {
    meta: {
        [name: string]: string;
    };
    option: {
        [name: string]: ByPulse<string>;
    };
    line: ByPulse<string>[];
}
export type ByPulse<T> = [y: Pulse, v: T];
export type ByMeasureIdx<T> = [idx: MeasureIdx, v: T];
export type GraphValue = [v: number, vf: number];
export declare function createGraphValue(obj: unknown): GraphValue;
export type GraphCurveValue = [a: number, b: number];
export declare function createGraphCurveValue(obj: unknown): GraphCurveValue;
export type GraphPoint = [y: Pulse, v: GraphValue, curve: GraphCurveValue];
export declare function createGraphPoint(arr: Array<unknown>): GraphPoint;
export type GraphSectionPoint = [ry: Pulse, v: GraphValue, curve: GraphCurveValue];
