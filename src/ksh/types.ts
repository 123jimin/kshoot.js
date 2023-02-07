export const PULSES_PER_WHOLE = 192n;

export type Pulse = bigint;

export interface Measure {
    /** Time signature of this measure */
    time_signature: [numerator: number ,denominator: number];
    /** Starting time of this measure */
    pulse: Pulse,
    /** Length of this measure, in pulses */
    length: Pulse,
    /** Chart lines, where each chart line is grouped with accompanying comments and options */
    lines: {
        pulse: Pulse;
        comments: CommentLine[];
        options: OptionLine[];
        chart: ChartLine;
    }[];
}

/** Parsed chart data; no further processing is done. */
export interface Chart {
    /** Unrecognized lines */
    unknown: {
        header: OptionLine[],
        body: [pulse: Pulse, line: OptionLine|UnknownLine][],
    };
    /** Header options for this chart */
    header: OptionLine[];
    /** Body of this chart, grouped by measures */
    body: Measure[];
    /** Audio effects defined in this chart */
    audio_effects: AudioEffectLine[];
}

export type Difficulty = 'light' | 'challenge' | 'extended' | 'infinite';

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

/** number: pos (0 to 1), ':': connection */
export type LaserKind = number|':'|null;

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
    bt: [NoteKind, NoteKind, NoteKind, NoteKind],
    fx: [NoteKind, NoteKind],
    laser: [LaserKind, LaserKind],
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

export interface LaneSpin {
    type: 'normal' | 'half' | 'swing';
    direction: 'left' | 'right';
    length: number;
}

export const LASER_POS_TO_CHAR = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmno";
export const LASER_CHAR_NONE = '-';
export const LASER_CHAR_CONNECTION = ':';

export const LASER_CHAR_TO_POS: Readonly<Record<string, number>> = Object.freeze(((mapping: Record<string, number>) => {
    for(let i=0; i<LASER_POS_TO_CHAR.length; ++i) mapping[LASER_POS_TO_CHAR[i]] = i/50;
    return mapping;
})({}));
export const toLaserChar = (pos: LaserKind): string => {
    if(pos == null) return LASER_CHAR_NONE;
    if(pos === LASER_CHAR_CONNECTION) return pos;
    if(!Number.isFinite(pos)) throw new RangeError(`Invalid pos: ${pos}!`);
    pos = Math.floor(pos * 51);
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