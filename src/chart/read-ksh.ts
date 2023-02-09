import {z} from 'zod';

import * as ksh from "../ksh/index.js";
import * as kson from "../kson/index.js";
import {Chart} from "./chart.js";

const PULSE_MULTIPLIER = kson.PULSES_PER_WHOLE / ksh.PULSES_PER_WHOLE;
type ConvertedChart = Chart & { compat: kson.CompatInfo };

const schema = Object.freeze({
    difficulty: z.union([z.enum(['light', 'challenge', 'extended', 'infinite']).transform((v) => ksh.difficultyToInt(v)), z.string()]),
    level: z.coerce.number().int().min(1).max(20).catch(1),
    bpm: z.coerce.number().finite().positive().default(120),
    audio_offset: z.coerce.number().finite().default(0),
    audio_volume: z.coerce.number().finite().nonnegative().default(100),
    gauge_total: z.coerce.number().finite().nonnegative().default(0),
} as const);

class Converter {
    readonly ksh_chart: ksh.Chart;
    chart: ConvertedChart;

    constructor(ksh_chart: Readonly<ksh.Chart>) {
        this.ksh_chart = ksh_chart;
        this.chart = new Chart(kson.schema.Kson.parse({
            compat: kson.schema.CompatInfo.parse({}),
        })) as ConvertedChart;
    
        this._convertUnknown();
        this._convertHeader();
        this._convertMeasures();
        this._convertAudioEffects();
        this._convertComments();
    }

    private _convertUnknown(): void {
        // TODO: add compat info
    }

    private _convertHeader(): void {
        const options = this.ksh_chart.header;
        const meta = this.chart.meta;
        for(const {name, value} of options) {
            switch(name) {
                case 'title':  meta.title = value; break;
                case 'title_img': meta.title_img_filename = value; break;
                case 'artist': meta.artist = value; break;
                case 'artist_img': meta.artist_img_filename = value; break;
                case 'effect': meta.chart_author = value; break;
                case 'jacket': meta.jacket_filename = value; break;
                case 'illustrator': meta.jacket_author = value; break;
                case 'difficulty': meta.difficulty = schema.difficulty.parse(value); break;
                case 'level': meta.level = schema.level.parse(value); break;
                case 't':
                    try {
                        const bpm = schema.bpm.parse(value);
                        this.chart.setBPM(0n, bpm);
                    } catch(_) { /* empty */ }
                    meta.disp_bpm = value;
                    break;
                case 'to':
                    if(value.trim() !== '0') try {
                        const bpm = schema.bpm.parse(value);
                        meta.std_bpm = bpm;
                    } catch(_) { /* empty */ }
                    break;
                case 'beat': {
                    const [numerator, denominator] = value.split('/').map((v) => parseInt(v));
                    this.chart.setTimeSignature(0n, numerator, denominator);
                    break;
                }
                case 'm': 
                    if(value.includes(';')) {
                        const arr = value.split(';');
                        this.chart.audio.bgm.filename = arr[0];
                        this.chart.audio.bgm.legacy = {
                            fp_filenames: arr.slice(1),
                        };
                    } else {
                        this.chart.audio.bgm.filename = value;
                    }
                    break;
                case 'mvol': this.chart.audio.bgm.vol = schema.audio_volume.parse(value)*(this.ksh_chart.version !== "" ? 1.0 : 0.6)/100; break;
                case 'o': this.chart.audio.bgm.offset = schema.audio_offset.parse(value); break;
                case 'bg': break; // TODO
                case 'layer': break; // TODO
                case 'po': this.chart.audio.bgm.preview.offset = schema.audio_offset.parse(value); break;
                case 'plength': this.chart.audio.bgm.preview.duration = schema.audio_offset.parse(value); break;
                case 'total': this.chart.gauge.total = schema.gauge_total.parse(value); break;
                case 'chokkakuvol': break; // TODO
                case 'chokkakuautovol': break; // TODO
                case 'filtertype': break; // TODO
                case 'pfiltergain': break; // TODO
                case 'pfilterdelay': break; // TODO
                case 'v': break; // TODO
                case 'vo': break; // TODO
                case 'ver': this.chart.compat.ksh_version = value; break;
                case 'information': meta.information = value; break;
                default:
                    // TODO: add compat info
            }
        }
    }

    private _convertMeasures(): void {
        let curr_time_sig: [number, number] = [4, 4];
        for(const [_, time_sig] of this.chart.beat.time_sig) {
            curr_time_sig = time_sig; break;
        }

        type LastNote = kson.ButtonNote|null;
        const last_notes: [LastNote, LastNote, LastNote, LastNote, LastNote, LastNote] = [null, null, null, null, null, null];
        
        type LastLaserSection = kson.LaserSection|null;
        const last_lasers: [LastLaserSection, LastLaserSection] = [null, null];

        let measure_idx = 0n;
        for(const measure of this.ksh_chart.measures) {
            if(curr_time_sig[0] !== measure.time_signature[0] || curr_time_sig[1] !== measure.time_signature[1]) {
                curr_time_sig = measure.time_signature;
                this.chart.setTimeSignature(measure_idx, ...curr_time_sig);
            }

            let pulse = measure.pulse * PULSE_MULTIPLIER;
            const pulses_per_line = (measure.length * PULSE_MULTIPLIER) / BigInt(measure.lines.length);

            for(const measure_line of measure.lines) {
                if(measure_line.options) for(const option of measure_line.options) {
                    switch(option.name) {
                        case 't': {
                            const bpm = schema.bpm.parse(option.value);
                            this.chart.setBPM(pulse, bpm);
                            break;
                        }
                        case 'beat': break; // Ignored
                        default:
                            // TODO: add compat info
                    }
                }

                loop_note: for(let i=0; i<6; ++i) {
                    const kind = i<4 ? (measure_line.bt ? measure_line.bt[i] : ksh.NoteKind.Empty) : (measure_line.fx ? measure_line.fx[i-4] : ksh.NoteKind.Empty);
                    const last_note = last_notes[i];
                    if(kind === ksh.NoteKind.Long && last_note && last_note[0] + last_note[1] >= pulse) {
                        last_note[1] = pulse + pulses_per_line; 
                        continue loop_note;
                    }

                    if(kind === ksh.NoteKind.Empty) {
                        last_notes[i] = null;
                        continue loop_note;
                    }

                    const next_note: [bigint, bigint] = [pulse, kind === ksh.NoteKind.Long ? pulses_per_line : 0n];

                    this.chart.addButtonNote(i, next_note);
                    last_notes[i] = next_note;
                }

                loop_laser: for(let i=0; i<2; ++i) {
                    const kind = (measure_line.laser ? measure_line.laser[i] : null);
                    const last_laser = last_lasers[i];
                }

                pulse += pulses_per_line;
            }

            ++measure_idx;
        }
    }

    private _convertAudioEffects(): void {
        // TODO: add audio effects
    }

    private _convertComments(): void {
        for(const [pulse, comment] of this.ksh_chart.comments) {
            this.chart.addComment(pulse * PULSE_MULTIPLIER, comment.value);
        }
    }
}
export default function(ksh_chart: ksh.Chart): ConvertedChart {
    return (new Converter(ksh_chart)).chart;
}