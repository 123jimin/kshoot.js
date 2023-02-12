/** Pulses per a whole note (4 quarter notes)  */
export const PULSES_PER_WHOLE = 192n;

/** Maximal length of a slant laser that would be considered as a slam */
export const LASER_SLAM_PULSES_MAX = PULSES_PER_WHOLE / 32n;

export type Pulse = bigint;

export interface MeasureLine extends Omit<ChartLine, 'type'> {
    options?: OptionLine[];
}

export interface Measure {
    /** Time signature of this measure */
    time_signature: [numerator: number ,denominator: number];
    /** Starting time of this measure */
    pulse: Pulse,
    /** Length of this measure, in pulses */
    length: Pulse,
    /** Chart lines, where each chart line is grouped with accompanying options */
    lines: MeasureLine[];
}

/** Parsed chart data; no further processing is done. */
export interface Chart {
    version: string;
    /** Unrecognized lines */
    unknown: {
        header: OptionLine[],
        body: [pulse: Pulse, line: OptionLine|UnknownLine][],
    };
    /** Header options for this chart */
    header: OptionLine[];
    /** Body of this chart, grouped by measures */
    measures: Measure[];
    /** Audio effects defined in this chart */
    audio_effects: AudioEffectLine[];
    comments: [pulse: Pulse, comment: CommentLine][];
}

export type Difficulty = 'light' | 'challenge' | 'extended' | 'infinite';
export const difficultyToInt = (difficulty: Difficulty): number => {
    switch(difficulty) {
        case 'light': return 0;
        case 'challenge': return 1;
        case 'extended': return 2;
        case 'infinite': return 3;
    }
};

export enum NoteKind {
    Empty, Short, Long,
}

export const btToNoteKind = (ch: string): NoteKind => {
    switch(ch) {
        case '1': return NoteKind.Short;
        case '2': return NoteKind.Long;
        case '0':
        default: return NoteKind.Empty;
    }
};

export const LEGACY_LONG_FX_NOTE_KIND: Readonly<Record<string, string>> = Object.freeze({
    'S': "Retrigger;8",
    'V': "Retrigger;12",
    'T': "Retrigger;16",
    'W': "Retrigger;24",
    'U': "Retrigger;32",
    'G': "Gate;4",
    'H': "Gate;8",
    'K': "Gate;12",
    'I': "Gate;16",
    'L': "Gate;24",
    'J': "Gate;32",
    'F': "Flanger",
    'P': "PitchShift",
    'B': "BitCrusher",
    'Q': "Phaser",
    'X': "Wobble;12",
    'A': "TapeStop",
    'D': "SideChain",
} as const);

export const fxToNoteKind = (ch: string): [NoteKind, string|null] => {
    switch(ch) {
        case '2': return [NoteKind.Short, null];
        case '1': return [NoteKind.Long, null];
        case '0': return [NoteKind.Empty, null];
        default:
            if(ch in LEGACY_LONG_FX_NOTE_KIND) {
                return [NoteKind.Long, LEGACY_LONG_FX_NOTE_KIND[ch]];
            }
            return [NoteKind.Empty, null];
    }
};

/** number: pos (0 to 50), ':': connection */
export type LaserKind = number|':'|null;

export const LASER_POS_MAX = 50;
export const LASER_POS_WIDE_LEFT = 12;
export const LASER_POS_WIDE_RIGHT = 37;

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
    bt?: [NoteKind, NoteKind, NoteKind, NoteKind],
    fx?: [NoteKind, NoteKind],
    laser?: [LaserKind, LaserKind],
    spin?: LaneSpin,
}

export interface AudioEffectLine {
    type: 'define_fx' | 'define_filter';
    name: string;
    params: [string, string][];
}

export interface UnknownLine {
    type: 'unknown';
    value: string;
}

/** Each line from a KSH chart, with minimally parsed data. */
export type Line = BarLine | CommentLine | OptionLine | ChartLine | AudioEffectLine | UnknownLine;

export interface LaneSpinCommon {
    direction: 'left' | 'right';
    length: number;
}

export interface LaneSpinNormal extends LaneSpinCommon {
    type: 'normal';
}

export interface LaneSpinHalf extends LaneSpinCommon {
    type: 'half';
}

export interface LaneSpinSwing extends LaneSpinCommon {
    type: 'swing'
    amplitude: number;
    repeat: number;
    decay: 'normal'|'slow'|'off';
}

export type LaneSpin = LaneSpinNormal | LaneSpinHalf | LaneSpinSwing;

export const LASER_POS_TO_CHAR = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmno";
export const LASER_CHAR_NONE = '-';
export const LASER_CHAR_CONNECTION = ':';

export const LASER_CHAR_TO_POS: Readonly<Record<string, number>> = Object.freeze(((mapping: Record<string, number>) => {
    for(let i=0; i<LASER_POS_TO_CHAR.length; ++i) mapping[LASER_POS_TO_CHAR[i]] = i;
    return mapping;
})({}));
export const toLaserChar = (pos: LaserKind): string => {
    if(pos == null) return LASER_CHAR_NONE;
    if(pos === LASER_CHAR_CONNECTION) return pos;
    if(!Number.isFinite(pos)) throw new RangeError(`Invalid pos: ${pos}!`);
    pos = Math.round(pos);
    if(pos <= 0) return LASER_POS_TO_CHAR[0];
    if(pos >= LASER_POS_TO_CHAR.length) return LASER_POS_TO_CHAR[LASER_POS_TO_CHAR.length-1];
    return LASER_POS_TO_CHAR[pos];
};
export const toLaserKind = (ch: string): LaserKind => {
    if(ch === LASER_CHAR_CONNECTION) return ch;
    if(ch === LASER_CHAR_NONE) return null;
    if(ch in LASER_CHAR_TO_POS) return LASER_CHAR_TO_POS[ch];
    return null;
};