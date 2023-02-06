export declare const PULSES_PER_WHOLE = 192n;
export type Difficulty = 'light' | 'challenge' | 'extended' | 'infinite';
export declare enum NoteKind {
    Empty = 0,
    Short = 1,
    Long = 2
}
export declare const btToNoteKind: (ch: string) => NoteKind;
export declare const LEGACY_LONG_FX_NOTE_KIND: Readonly<Record<string, string>>;
export declare const fxToNoteKind: (ch: string) => [NoteKind, string | null];
/** number: pos (0 to 1), ':': connection */
export type LaserKind = number | ':' | null;
export interface BarLine {
    type: 'bar';
}
export interface CommentLine {
    type: 'comment';
    value: string;
}
export interface OptionLine {
    type: 'option';
    name: string;
    value: string;
}
export interface ChartLine {
    type: 'chart';
    bt: [NoteKind, NoteKind, NoteKind, NoteKind];
    fx: [NoteKind, NoteKind];
    legacy_fx?: [string | null, string | null];
    laser: [LaserKind, LaserKind];
    spin?: LaneSpin;
}
export interface UnknownLine {
    type: 'unknown';
    value: string;
}
export interface AudioEffectLine {
    type: 'define_fx' | 'define_filter';
    name: string;
    params: [string, string][];
}
/** Each line from a KSH chart, with minimally parsed data. */
export type Line = BarLine | CommentLine | OptionLine | ChartLine | AudioEffectLine | UnknownLine;
export interface LaneSpin {
    type: '@(' | '@)' | '@<' | '@>' | 'S<' | 'S>';
    length: number;
}
export declare const LASER_POS_TO_CHAR = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmno";
export declare const LASER_CHAR_NONE = "-";
export declare const LASER_CHAR_CONNECTION = ":";
export declare const LASER_CHAR_TO_POS: Readonly<Record<string, number>>;
export declare const toLaserChar: (pos: LaserKind) => string;
export declare const toLaserKind: (ch: string) => LaserKind;
