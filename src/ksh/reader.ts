import {
    PULSES_PER_WHOLE, NoteKind, type LaserKind,
    btToNoteKind, fxToNoteKind, toLaserKind,
} from "./types.js";

import type {
    Chart, Measure, Line, Pulse,
    BarLine, CommentLine, OptionLine, ChartLine, AudioEffectLine, UnknownLine,
    LaneSpin,
} from "./types.js";

import Writer from "./writer.js";

interface ChartLineWithLegacyFX extends ChartLine {
    legacy_fx: [string|null, string|null]
}

const parseTimeSignature = (time_signature: string): [number, number] => {
    const [numerator, denominator] = time_signature.split("/", 2);
    return [parseInt(numerator), parseInt(denominator)];
};

const parseOption = (chunk: string): [string, string] => {
    const tokens = chunk.split('=');
    return [tokens[0], tokens.slice(1).join('=')];
};

const parseSpinHead = (spin_head: string): Omit<LaneSpin, 'length'>|null => {
    switch(spin_head) {
        case '@(': return {type: 'normal', direction: 'left'};
        case '@)': return {type: 'normal', direction: 'right'};
        case '@<': return {type: 'half', direction: 'left'};
        case '@>': return {type: 'half', direction: 'right'};
        case 'S<': return {type: 'swing', direction: 'left'};
        case 'S>': return {type: 'swing', direction: 'right'};
        default: return null;
    }
};

/**
 * A class for reading KSH chart data
 */
export default class Reader implements Chart {
    unknown: { header: OptionLine[], body: [Pulse, OptionLine|UnknownLine][] }
        = { header: [], body: [] };

    header: OptionLine[] = [];
    body: Measure[] = [];
    audio_effects: AudioEffectLine[] = [];
    comments: [Pulse, CommentLine][] = [];

    private constructor() { /* empty */ }

    private _curr_pulse = 0n;
    private _curr_pulses_per_measure = PULSES_PER_WHOLE;
    private _curr_time_signature: [number, number] = [4, 4];

    private _handleHeader(lines: Exclude<Line, BarLine>[]): CommentLine[] {
        const carryovers: CommentLine[] = [];

        for(const line of lines) {
            switch(line.type) {
                case 'comment':
                    carryovers.push(line);
                    break;
                case 'option':
                    this.header.push(line);
                    break;
                case 'define_fx':
                case 'define_filter':
                    this.audio_effects.push(line);
                    break;
                default:
                    this._addUnknown(true, 0n, line);
            }

            if(line.type === 'option' && line.name === 'beat') {
                this._setTimeSignature(...parseTimeSignature(line.value));
            }
        }

        return carryovers;
    }

    private _setTimeSignature(numerator: number, denominator: number) {
        if(numerator <= 0 || !Number.isFinite(numerator)) {
            throw new Error(`Invalid time signature numerator: ${numerator}`);
        }
        if(denominator <= 0 || !Number.isFinite(denominator)) {
            throw new Error(`Invalid time signature denominator: ${denominator}`);
        }
        if(PULSES_PER_WHOLE % BigInt(denominator) !== 0n) {
            throw new Error(`Invalid time signature denominator: ${denominator}`);
        }
        this._curr_pulses_per_measure = PULSES_PER_WHOLE / BigInt(denominator) * BigInt(numerator);
        this._curr_time_signature = [numerator, denominator];
    }

    private _handleMeasure(chart_line_count: bigint, lines: Exclude<Line, BarLine>[]): OptionLine[] {
        if(chart_line_count === 0n) {
            chart_line_count = 1n;
            lines.push({
                type: 'chart',
                bt: [NoteKind.Empty, NoteKind.Empty, NoteKind.Empty, NoteKind.Empty],
                fx: [NoteKind.Empty, NoteKind.Empty],
                laser: [null, null],
            });
        }

        const measure: Measure = {
            time_signature: this._curr_time_signature,
            pulse: this._curr_pulse,
            length: this._curr_pulses_per_measure,
            lines: [],
        };

        const curr_line: {pulse: bigint, options: OptionLine[]} = {
            pulse: this._curr_pulse, options: [],
        };

        const carryovers: OptionLine[] = [];

        for(const line of lines) {
            switch(line.type) {
                case 'comment':
                    this.comments.push([curr_line.pulse, line]);
                    break;
                case 'option':
                    curr_line.options.push(line);
                    if(line.name === 'beat') {
                        if(curr_line.pulse === this._curr_pulse) {
                            this._setTimeSignature(...parseTimeSignature(line.value));
                            measure.time_signature = this._curr_time_signature;
                            measure.length = this._curr_pulses_per_measure;
                        } else {
                            carryovers.push(line);
                        }
                    }
                    break;
                case 'chart':
                    measure.lines.push({
                        pulse: curr_line.pulse,
                        options: curr_line.options,
                        chart: line,
                    });

                    curr_line.options = [];

                    if(measure.length % chart_line_count !== 0n) {
                        throw new Error(`Invalid line count`);
                    }

                    curr_line.pulse += measure.length / chart_line_count;

                    break;
                case 'define_fx':
                case 'define_filter':
                    this.audio_effects.push(line);
                    break;
                case 'unknown':
                    this._addUnknown(false, curr_line.pulse, line);
            }
        }

        this._curr_pulse = curr_line.pulse;
        this.body.push(measure);

        for(const option of curr_line.options) carryovers.push(option);

        return carryovers;
    }

    private _addUnknown(is_header: boolean, pulse: bigint, line: Exclude<Line, BarLine | CommentLine | AudioEffectLine>) {
        if(is_header && line.type === 'option') {
            this.unknown.header.push(line);
            return;
        }
        
        switch(line.type) {
            case 'option':
            case 'unknown':
                this.unknown.body.push([pulse, line]);
                break;
            default:
                this.unknown.body.push([pulse, {
                    type: 'unknown',
                    value: Writer.serialize(line),
                }]);
        }
    }

    /**
     * Parses the given KSH chart. Check `ksh.parse` for further details.
     * 
     * @param chart_str a string representing the chart (with or without the BOM)
     * @returns parsed data
     * @throws when the chart is malformed
     */
    static parse(chart_str: string): Readonly<Chart> {
        const reader = new Reader();

        let is_header = true;
        let chunk: Exclude<Line, BarLine>[] = [];
        let lines_per_measure = 0n;
        for(const line_str of chart_str.split("\n")) {
            if(/^\s*$/.test(line_str)) continue;

            const line = Reader.parseLine(line_str);
            if('legacy_fx' in line) {
                for(let i=0; i<2; ++i) {
                    const legacy_fx = line.legacy_fx[i];
                    if(legacy_fx == null) continue;

                    chunk.push({
                        type: 'option',
                        name: ["fx-l", "fx-r"][i],
                        value: legacy_fx,
                    });
                }
            }

            if(line.type === 'bar') {
                if(is_header) chunk = reader._handleHeader(chunk);
                else chunk = reader._handleMeasure(lines_per_measure, chunk);

                is_header = false;
                lines_per_measure = 0n;
                continue;
            }

            if(line.type === 'chart') {
                ++lines_per_measure;
            }

            chunk.push(line);
        }

        if(chunk.length > 0) {
            if(is_header) reader._handleHeader(chunk);
            else reader._handleMeasure(lines_per_measure, chunk);
        }

        return reader;
    }

    /**
     * Parses one line from the KSH chart.
     * @param line a line from a chart
     * @returns parsed line
     */
    static parseLine(line: string): Line | ChartLineWithLegacyFX {
        line = line.replace(/^\uFEFF|[\r\n]+$/g, '');
        
        if(line.startsWith("//")) {
            return {type: 'comment', value: line.slice(2)};
        }

        if(/^--\s*$/.test(line)) {
            return {type: 'bar'};
        }

        let match = line.match(/^#(define_(?:fx|filter))\s+(\S+)\s+(\S.+)$/);
        if(match) {
            return {
                type: match[1] as ('define_fx'|'define_filter'),
                name: match[2],
                params: match[3].split(';').map((param) => parseOption(param)),
            };
        }
        
        match = line.match(/^([012]{4})\|([012A-Z]{2})\|([0-9A-Za-o\-:]{2})(?:(@[()<>]|S[<>])(\d+))?$/);
        if(match) {
            const bt = match[1].split('').map(btToNoteKind) as [NoteKind, NoteKind, NoteKind, NoteKind];
            const legacy_fx: [string|null, string|null] = [null, null];
            const fx = match[2].split('').map((x, ind) => {
                const [note_kind, legacy] = fxToNoteKind(x);
                legacy_fx[ind] = legacy;
                return note_kind;
            }) as [NoteKind, NoteKind];
            const laser = match[3].split('').map(toLaserKind) as [LaserKind, LaserKind];

            let line: ChartLine|ChartLineWithLegacyFX = {
                type: 'chart', bt, fx, laser
            };

            if(legacy_fx[0] != null || legacy_fx[1] != null) {
                line = Object.assign(line, {legacy_fx});
            }

            if(match[4] && match[5]) {
                const spin_head = parseSpinHead(match[4]);

                if(spin_head) {
                    line.spin = {
                        ...spin_head,
                        length: parseInt(match[5]),
                    };
                }
            }

            return line;
        }

        if(line.includes('=')) {
            const [option_name, option_value] = parseOption(line);
            return {type: 'option', name: option_name, value: option_value};
        }

        return {
            type: 'unknown',
            value: line,
        }
    }
}