import type {z} from 'zod';
import type {IMapSource} from 'sorted-btree';

import {iterateAll, min, max} from "../util.js";

import * as ksh from "../ksh/index.js";
import * as kson from "../kson/index.js";
import {default as readKSH} from "./read-ksh.js";

export * from "./object.js";
import type {
    MeasureInfo, TimingInfo,
    ButtonObject, LaserObject,
    NoteObject, ChartObject
} from "./object.js";

export type Pulse = kson.Pulse;
export const PULSES_PER_WHOLE = kson.PULSES_PER_WHOLE;

type ChartMetaInfo = z.output<typeof kson.schema.MetaInfo>;
type ChartBeatInfo = z.output<typeof kson.schema.BeatInfo>;
type ChartGaugeInfo = z.output<typeof kson.schema.GaugeInfo>;
type ChartNoteInfo = z.output<typeof kson.schema.NoteInfo>;
type ChartAudioInfo = z.output<typeof kson.schema.AudioInfo>;
type ChartEditorInfo = z.output<typeof kson.schema.EditorInfo>;
type ChartCompatInfo = z.output<typeof kson.schema.CompatInfo>;

export class Chart implements kson.Kson {
    version: string = kson.VERSION;
    meta: ChartMetaInfo = kson.schema.MetaInfo.parse({});
    beat: ChartBeatInfo = kson.schema.BeatInfo.parse({});
    private _gauge?: ChartGaugeInfo;
    get gauge(): ChartGaugeInfo { return this._gauge ?? (this._gauge = kson.schema.GaugeInfo.parse({})); }
    note: ChartNoteInfo = kson.schema.NoteInfo.parse({});
    private _audio?: ChartAudioInfo;
    get audio(): ChartAudioInfo { return this._audio ?? (this._audio = kson.schema.AudioInfo.parse({})); }
    private _camera?: kson.CameraInfo;
    private _bg?: kson.BGInfo;
    private _editor?: ChartEditorInfo;
    get editor(): ChartEditorInfo { return this._editor ?? (this._editor = kson.schema.EditorInfo.parse({})); }
    compat?: ChartCompatInfo;
    impl?: unknown;

    /**
     * Creates a chart object, optionally initialized to given KSON data.
     * @param [kson_obj] Initial KSON data (**this will be shallow-copied**)
     */
    constructor(kson_obj?: Readonly<kson.Kson>) {
        if(kson_obj) this.setKSON(kson_obj);
    }

    /**
     * Resets every chart data. Identical to calling {@link setKSON} with the `null` argument.
     * It is recommended to create another chart object over using this function.
     */
    reset() {
        this.setKSON(null);
    }

    /* Iterators */

    /** Converts an iterator of `[Pulse, ...]` into `[TimingInfo, ...]`. */
    *withTimingInfo<T>(it: IterableIterator<[kson.Pulse, T]>): Generator<[Readonly<TimingInfo>, T]> {
        const bpm_it = this.beat.bpm[Symbol.iterator]();
        const time_sig_it = this.beat.time_sig[Symbol.iterator]();

        let {value: curr_bpm}: {value: kson.ByPulse<number>} = bpm_it.next();
        let {value: next_bpm}: {value?: kson.ByPulse<number>} = bpm_it.next();

        const {value: init_time_sig}: {value: kson.ByMeasureIdx<kson.TimeSig>} = time_sig_it.next();
        let {value: next_time_sig}: {value?: kson.ByMeasureIdx<kson.TimeSig>} = time_sig_it.next();

        const measure_info: MeasureInfo = {
            idx: 0n, pulse: 0n, time_sig: init_time_sig[1],
            length: (PULSES_PER_WHOLE * BigInt(init_time_sig[1][0])) / BigInt(init_time_sig[1][1]),
            beat_length: PULSES_PER_WHOLE / BigInt(init_time_sig[1][1]),
        };

        let base_pulse = 0n;
        let base_time = 0;

        let time_divider = curr_bpm[1] * Number(PULSES_PER_WHOLE);

        for(const [pulse, data] of it) {
            if(next_bpm && pulse <= next_bpm[0]) {
                base_time += Number(240_000n*(pulse-base_pulse))/time_divider;
                base_pulse = pulse;
                time_divider = next_bpm[1] * Number(PULSES_PER_WHOLE);

                curr_bpm = next_bpm;
                next_bpm = bpm_it.next().value;
            }

            let measure_idx = measure_info.idx + (pulse - measure_info.pulse) / measure_info.length;
            if(next_time_sig && measure_idx <= next_time_sig[0]) {
                measure_info.pulse = measure_info.pulse + (next_time_sig[0] - measure_info.idx) * measure_info.length;
                measure_info.idx = next_time_sig[0];
                measure_info.time_sig = next_time_sig[1];
                measure_info.beat_length = PULSES_PER_WHOLE / BigInt(next_time_sig[1][1]);
                measure_info.length = measure_info.beat_length * BigInt(next_time_sig[1][0]);
                measure_idx = next_time_sig[0] + (pulse - measure_info.pulse) / measure_info.length;
                next_time_sig  = time_sig_it.next().value;
            }

            measure_info.pulse += (measure_idx - measure_info.idx) * measure_info.length;
            measure_info.idx = measure_idx;

            yield [{
                pulse,
                time: base_time + Number(240_000n*(pulse - base_pulse))/time_divider,
                bpm: curr_bpm[1],
                measure: measure_info,
            }, data];
        }
    }
    
    /** Iterates through all button objects, grouped by chords. */
    *buttonNotes(): Generator<[Pulse, ButtonObject[]]> {
        for(const [pulse, buttons] of iterateAll<kson.ButtonNote>(...this.note.bt, ...this.note.fx)) {
            yield [pulse, buttons.map(([lane, length]) => ({lane, length}))];
        }
    }

    /** Iterates through each laser segment, with lane (`0`: left, `1`: right) specified. */
    laserNotes(lane: 0|1): Generator<[Pulse, LaserObject]>;
    
    /** Iterates through each laser segment. */
    laserNotes(): Generator<[Pulse, LaserObject[]]>;

    *laserNotes(lane?: 0|1): Generator<[Pulse, LaserObject]|[Pulse, LaserObject[]]> {
        if(lane == null) {
            return iterateAll<[Pulse, LaserObject]>(this.laserNotes(0), this.laserNotes(1));
        }

        for(const [pulse, laser_sections, width] of this.note.laser[lane]) {
            const section_it = laser_sections[Symbol.iterator]();
            let {value: curr_section}: {value: kson.GraphSectionPoint} = section_it.next();
            let {value: next_section}: {value?: kson.GraphSectionPoint} = section_it.next();

            while(true) {
                const length: kson.Pulse = next_section ? next_section[0] - curr_section[0] : 0n;

                if(length > 0n || curr_section[1][0] !== curr_section[1][1]) {
                    yield [pulse + curr_section[0], {
                        section_pulse: pulse,
                        lane, width, length,
                        v: curr_section[1], ve: next_section ? next_section[1][0] : curr_section[1][1],
                        curve: curr_section[2],
                    }];
                }
                
                if(!next_section) break;
                curr_section = next_section;
                next_section = section_it.next().value;
            }
        }
    }

    /* Chart editing */

    /**
     * Sets the BPM for the given pulse.
     * @param pulse 
     * @param bpm 
     */
    setBPM(pulse: Pulse, bpm: number) {
        if(bpm <= 0) throw new RangeError(`Invalid BPM: ${bpm}!`);
        
        this.beat.bpm.put([pulse, bpm]);
    }

    /**
     * Sets the time signature from the given pulse.
     * @param pulse 
     * @param numerator 
     * @param denominator 
     */
    setTimeSignature(measure_idx: kson.MeasureIdx, numerator: number, denominator: number) {
        if(numerator <= 0 || !Number.isSafeInteger(numerator)) throw new RangeError(`Invalid numerator: ${numerator}!`);
        if(denominator <= 0 || !Number.isSafeInteger(denominator)) throw new RangeError(`Invalid denominator: ${denominator}!`);

        if(PULSES_PER_WHOLE % BigInt(denominator) !== 0n) {
            throw new RangeError(`Invalid denominator: ${denominator}`);
        }

        this.beat.time_sig.put([measure_idx, [numerator, denominator]]);
    }

    addButtonNote(bt_or_fx_lane: number, note: kson.ButtonNote) {
        if(bt_or_fx_lane < 4) this.addBTNote(bt_or_fx_lane, note);
        else this.addFXNote(bt_or_fx_lane-4, note);
    }

    addBTNote(lane: number, note: kson.ButtonNote) {
        this.note.bt[lane].put(note);
    }

    addFXNote(lane: number, note: kson.ButtonNote) {
        this.note.fx[lane].put(note);
    }

    addLaserSection(lane: number, section: kson.LaserSection): z.output<typeof kson.schema.LaserSection> {
        const parsed_section = kson.schema.LaserSection.parse(section);
        this.note.laser[lane].put(parsed_section);
        return parsed_section;
    }

    addComment(pulse: Pulse, comment: string) {
        this.editor.comment.push([pulse, comment]);
    }

    /* Utility functions */

    getFirstNotePulse(): kson.Pulse {
        return min(
            ...this.note.bt.map((notes) => notes.minKey() ?? 0n),
            ...this.note.fx.map((notes) => notes.minKey() ?? 0n),
            ...this.note.laser.map((notes) => notes.minKey() ?? 0n),
        ) ?? 0n;
    }

    getLastNotePulse(): kson.Pulse {
        return max(
            ...this.note.bt.map((notes) => notes.maxKey() ?? 0n),
            ...this.note.fx.map((notes) => notes.maxKey() ?? 0n),
            ...this.note.laser.map((notes) => notes.maxKey() ?? 0n),
        ) ?? 0n;
    }

    /** Get total duration and a map containing durations for each BPM. */
    getBPMDurationMap(): [number, IMapSource<number, number>] {
        const first_pulse = this.getFirstNotePulse();
        const last_pulse = this.getLastNotePulse();

        const bpm_duration = new Map<number, number>();
        let curr_bpm = 120;
        let curr_pulse = 0n;
        let total_duration = 0;

        for(const [pulse, bpm] of this.beat.bpm) {
            if(pulse > curr_pulse) {
                let next_pulse = pulse;
                if(curr_pulse < first_pulse) curr_pulse = first_pulse;
                if(next_pulse > last_pulse) next_pulse = last_pulse;
                if(curr_pulse < next_pulse) {
                    const duration = Number(240_000n * (next_pulse - curr_pulse)) / (curr_bpm * Number(PULSES_PER_WHOLE));
                    const prev_duration = bpm_duration.get(curr_bpm) ?? 0;
                    bpm_duration.set(curr_bpm, prev_duration + duration);
                    total_duration += duration;
                }
            }
            [curr_pulse, curr_bpm] = [pulse, bpm];
        }

        if(curr_pulse < first_pulse) curr_pulse = first_pulse;
        if(curr_pulse < last_pulse) {
            const duration = Number(240_000n * (last_pulse - curr_pulse)) / (curr_bpm * Number(PULSES_PER_WHOLE));
            const prev_duration = bpm_duration.get(curr_bpm) ?? 0;
            bpm_duration.set(curr_bpm, prev_duration + duration);
            total_duration += duration;
        }

        return [total_duration, bpm_duration];
    }

    /** Calculates the median BPM for this chart, which can be used in place of `meta.std_bpm`. */
    getMedianBPM(): number {
        const [total_duration, bpm_duration] = this.getBPMDurationMap();
        if(bpm_duration.size === 0) return 120;

        const half_duration = total_duration / 2;
        let curr_duration = 0;
        let last_bpm = 120;

        for(const [bpm, duration] of [...bpm_duration.entries()].sort(([bpm_x], [bpm_y]) => bpm_x-bpm_y)) {
            curr_duration += duration;
            last_bpm = bpm;
            if(curr_duration >= half_duration) break;
        }

        return last_bpm;
    }

    /* Data */

    /**
     * Set the chart data to given KSON object.
     * @param kson_obj the KSON object, or `null` for fully resetting the chart
     */
    setKSON(kson_obj: Readonly<kson.Kson>|null) {
        if(!kson_obj) kson_obj = kson.schema.Kson.parse({});

        this.version = kson_obj.version;
        this.meta = kson_obj.meta;
        this.beat = kson.schema.BeatInfo.parse(kson_obj.beat);
        this.note = kson.schema.NoteInfo.parse(kson_obj.note);

        if(kson_obj.gauge != null) this._gauge = kson_obj.gauge;
        if(kson_obj.audio != null) this._audio = kson.schema.AudioInfo.parse(kson_obj.audio);
        if(kson_obj.camera != null) this._camera = kson_obj.camera;
        if(kson_obj.bg != null) this._bg = kson_obj.bg;
        if(kson_obj.editor != null) this._editor = kson.schema.EditorInfo.parse(kson_obj.editor);
        if(kson_obj.compat != null) this.compat = kson.schema.CompatInfo.parse(kson_obj.compat);
        if(kson_obj.impl != null) this.impl = kson_obj.impl;
    }

    /**
     * Reads the given KSH chart.
     * @param chart_str a string representing the chart
     * @returns parsed chart data
     * @throws when the given string represents an invalid KSH chart
     */
    static parseKSH(chart_str: string): Chart {
        const ksh_chart = ksh.parse(chart_str);
        return readKSH(ksh_chart);
    }

    /**
     * Reads the given KSON chart.
     * @param chart_data a string or an object representing the chart file
     * @returns parsed chart data
     * @throws when the given argument represents an invalid KSON chart 
     */
    static parseKSON(chart_data: string|object): Chart {
        const chart_obj = (typeof chart_data === 'string' ? JSON.parse(chart_data[0] === '\uFEFF' ? chart_data.slice(1) : chart_data) : chart_data);
        return new Chart(kson.schema.Kson.parse(chart_obj));
    }
}

/**
 * Reads the given KSH or KSON chart.
 * @param chart_str a string representing the chart (KSH or KSON)
 * @returns parsed chart data
 * @throws when the given string represents an invalid chart
 */
export const parse = (chart_str: string): Chart => {
    if(/^\s*$/.test(chart_str)) {
        return new Chart();
    }

    let chart_obj: object|null = null;

    try {
        // Use the fact that the top-level entity of a valid KSON chart must be an object.
        if(chart_str[0] === '{') chart_obj = JSON.parse(chart_str);
        else if(chart_str.startsWith("\uFEFF{")) chart_obj = JSON.parse(chart_str.slice(1));
    } catch(_) { /* empty */ }

    // Only try to parse as KSON, if the string is a valid JSON.
    // It's actually impossible for a spec-conforming KSH chart to be a valid JSON.
    if(chart_obj) {
        return Chart.parseKSON(chart_obj);
    }

    return Chart.parseKSH(chart_str);
};