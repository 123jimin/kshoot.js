import type {z} from 'zod';
import type {IMapSource} from 'sorted-btree';

// Utilities
import type {SortedList} from "../sorted-list.js";
import {type JSONObject, iterateAll, min, max} from "../util.js";

// File formats
import * as ksh from "../ksh/index.js";
import * as kson from "../kson/index.js";

import {default as fromKSH} from "./from-ksh.js";
import {default as toKSH} from "./to-ksh.js";
import {default as toKSON} from "./to-kson.js";

// Various structures
export * from "./object.js";
import type {
    ButtonObject, LaserObject, LaserLane,
} from "./object.js";

export * from "./conduct.js";
import type {
    Conduct,
    ButtonConductWithoutLane, ButtonConduct,
    LaserConductWithoutLane, LaserConduct,
} from "./conduct.js";
import { iterateButtonConducts, iterateLaserConducts } from "./conduct.js";

export * from "./timing.js";
import {Timing} from "./timing.js";
import type {
    PulseRange, MeasureInfo, TimingInfo
} from "./timing.js";

export type ChartFormat = 'ksh'|'kson';

export type Pulse = kson.Pulse;
export const PULSES_PER_WHOLE = kson.PULSES_PER_WHOLE;

export type MeasureIdx = kson.MeasureIdx;

type ChartMetaInfo = z.output<typeof kson.schema.MetaInfo>;
type ChartBeatInfo = z.output<typeof kson.schema.BeatInfo>;
type ChartGaugeInfo = z.output<typeof kson.schema.GaugeInfo>;
type ChartNoteInfo = z.output<typeof kson.schema.NoteInfo>;
type ChartLaserSection = z.output<typeof kson.schema.LaserSection>;
type ChartAudioInfo = z.output<typeof kson.schema.AudioInfo>;
type ChartCameraInfo = z.output<typeof kson.schema.CameraInfo>;
type ChartBGInfo = z.output<typeof kson.schema.BGInfo>;
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
    private _camera?: ChartCameraInfo;
    get camera(): ChartCameraInfo { return this._camera ?? (this._camera = kson.schema.CameraInfo.parse({})); }
    private _bg?: ChartBGInfo;
    get bg(): ChartBGInfo { return this._bg ?? (this._bg = kson.schema.BGInfo.parse({})); }
    private _editor?: ChartEditorInfo;
    get editor(): ChartEditorInfo { return this._editor ?? (this._editor = kson.schema.EditorInfo.parse({})); }
    compat?: ChartCompatInfo;
    impl?: unknown;
    
    /** Returns raw values what kson.schema.Chart would have returned, without filling missing fields. */
    get raw(): z.output<typeof kson.schema.Chart> {
        return {
            version: this.version,
            meta: this.meta,
            beat: this.beat,
            gauge: this._gauge,
            note: this.note,
            audio: this._audio,
            camera: this._camera,
            bg: this._bg,
            editor: this._editor,
            compat: this.compat,
            impl: this.impl,
        };
    }

    /** Get a string representation of the difficulty */
    get difficulty_str(): string {
        const difficulty = this.meta.difficulty;
        if(typeof difficulty !== "string") {
            switch(difficulty) {
                case 0: return 'light';
                case 1: return 'challenge';
                case 2: return 'extended';
                case 3: return 'infinite';
                default: return `${difficulty}`;
            }
        }
        return difficulty;
    }

    /** Get an id representation (NOV, ADV, ...) of the difficulty */
    get difficulty_id(): string {
        const difficulty = this.meta.difficulty;
        let difficulty_str = "";
        if(typeof difficulty === 'string') {
            difficulty_str = difficulty.toUpperCase();
        } else {
            switch(difficulty) {
                case 0: return 'NOV';
                case 1: return 'ADV';
                case 2: return 'EXH';
                case 3: return 'MXM';
                default: return `${difficulty}`;
            }
        }

        switch(difficulty_str) {
            case 'MAXIMUM': return 'MXM';
            case 'GRAVITY': return 'GRV';
            case 'HEAVEN': case 'HEAVENLY': return 'HVN';
            case 'VIVID': return 'VVD';
            case 'EXCEED': return 'XCD';
            default: return difficulty_str.slice(0, 3);
        }
    }

    /**
     * Creates a chart object, optionally initialized to given KSON data.
     * @param [kson_obj] Initial KSON data
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

    /**
     * Creates a {@link Timing} object, which can be used to query information related to timing.
     * @returns The timing object for this chart
     */
    getTiming(): Timing {
        return new Timing(this.beat);
    }

    /* Iterators */

    /**
     * Converts an iterator of `[Pulse, ...]` into `[TimingInfo, ...]`.
     * Alias for `this.getTiming().withTimingInfo(it)`.
     * 
     * @param it An iterator for a pair of `Pulse` and any object
     * @yields {[TimingInfo, T]} `it` but `Pulse` replaced with the timing info
     */
    *withTimingInfo<T>(it: IterableIterator<[kson.Pulse, T]>): Generator<[Readonly<TimingInfo>, T]> {
        for(const x of this.getTiming().withTimingInfo(it)) {
            yield x;
        }
    }
    
    /**
     * Iterates through all button objects, grouped by chords.
     * @param [range] Only retrieve the buttons contained in this range, including the beginning but excluding the end of range.
     *  Long notes that are partially included in the range will also be included.
     * @yields {[Pulse, ButtonObject[]]} Pairs of pulse and button objects (chord)
     */
    *buttonNotes(range?: PulseRange): Generator<[Pulse, ButtonObject[]]> {
        const generators: Generator<kson.ButtonNote>[] = [...this.note.bt, ...this.note.fx].map(function* (notes: SortedList<kson.ButtonNote>): Generator<kson.ButtonNote> {
            if(!range) {
                for(const note of notes[Symbol.iterator]()) yield note;
                return;
            }
            
            // Check if there's a long note including the begin of the range
            const prev_note = notes.nextLowerPair(range[0]);
            if(prev_note && range[0] <= prev_note[0] + prev_note[1][0]) {
                yield [prev_note[0], ...prev_note[1]];
            }

            for(const value of notes.iterateRange(range[0], range[1])) {
                yield value;
            }
        });

        for(const [pulse, buttons] of iterateAll<kson.ButtonNote>(...generators)) {
            yield [pulse, buttons.map(([lane, length]) => ({lane, length}))];
        }
    }

    /** Iterates through each laser segment, with lane (`0`: left, `1`: right) specified. */
    laserNotes(lane: LaserLane, range?: PulseRange): Generator<[pulse: Pulse, objects: LaserObject]>;
    /** Iterates through each laser segment. */
    laserNotes(range?: PulseRange): Generator<[pulse: Pulse, objects: LaserObject[]]>;

    *laserNotes(lane_or_range?: LaserLane|PulseRange, range?: PulseRange): Generator<[Pulse, LaserObject]|[Pulse, LaserObject[]]> {
        if(lane_or_range == null || Array.isArray(lane_or_range)) {
            for(const [pulse, lasers] of iterateAll<[Pulse, LaserObject]>(this.laserNotes(0, lane_or_range), this.laserNotes(1, lane_or_range))) {
                yield [pulse, lasers.map((laser) => laser[1])];
            }
            return;
        }

        const lasers = this.note.laser[lane_or_range];
        const handleSection = function*([pulse, section_points, width]: ChartLaserSection): Generator<[Pulse, LaserObject]> {
            // TODO: handle the case where the laser section overlaps with the beginning of the range

            const section_it = section_points[Symbol.iterator]();
            let curr_section: kson.GraphSectionPoint = section_it.next().value;
            let next_section: kson.GraphSectionPoint|undefined = section_it.next().value;

            while(true) {
                if(range && range[1]-pulse <= curr_section[0]) return;
                const length: kson.Pulse = next_section ? next_section[0] - curr_section[0] : 0n;

                if(range == null || range[0] <= pulse+curr_section[0]+length) {
                    if (length > 0n || curr_section[1][0] !== curr_section[1][1]) {
                        yield [pulse + curr_section[0], {
                            section_pulse: pulse,
                            lane: lane_or_range, width, length,
                            v: curr_section[1], ve: next_section ? next_section[1][0] : curr_section[1][1],
                            curve: curr_section[2],
                        }];
                    }
                }
                
                if(!next_section) break;
                curr_section = next_section;
                next_section = section_it.next().value;
            }
        };

        if(range) {
            // Check if there's a laser note including the begin of the range
            const first_section = lasers.nextLowerPair(range[0]);
            if(first_section) {
                const [pulse, value] = first_section;
                for(const laser_object of handleSection([pulse, ...value])) {
                    yield laser_object;
                }
            }
        }

        const entries = range ? lasers.iterateRange(range[0], range[1]) : lasers[Symbol.iterator]();
        for(const section of entries) {
            for(const laser_object of handleSection(section)) {
                yield laser_object;
            }
        }
    }

    /**
     * Iterates through each {@link ButtonConduct}, which represents a player's action at a moment.
     */
    *buttonConducts(): Generator<[pulse: Pulse, conducts: ButtonConduct[]]> {
        const generators = [...this.note.bt, ...this.note.fx].map((notes) => iterateButtonConducts(notes));
        for(const [pulse, conducts] of iterateAll<[Pulse, ButtonConductWithoutLane]>(...generators)) {
            yield [pulse, conducts.map(([lane, conduct]) => Object.assign(conduct, {lane}))];
        }
    }

    /**
     * Iterates through each {@link LaserConduct}, which represents a player's action at a moment.
     */
    *laserConducts(): Generator<[pulse: Pulse, conducts: LaserConduct[]]> {
        const generators = this.note.laser.map((notes) => iterateLaserConducts(notes));
        for(const [pulse, conducts] of iterateAll<[Pulse, LaserConductWithoutLane]>(...generators)) {
            yield [pulse, conducts.map(([lane, conduct]) => Object.assign(conduct, {lane: lane as LaserLane}))];
        }
    }

    /**
     * Iterates through each {@link Conduct}, which represents a player's action at a moment.
     */
    *conducts(): Generator<[pulse: Pulse, conducts: Conduct[]]> {
        const button_generators = [...this.note.bt, ...this.note.fx].map((notes) => iterateButtonConducts(notes));
        const generators = [
            ...button_generators,
            ...this.note.laser.map((notes: kson.LaserSections) => iterateLaserConducts(notes)),
        ];
        for(const [pulse, conducts] of iterateAll<[Pulse, ButtonConductWithoutLane|LaserConductWithoutLane]>(...generators)) {
            yield [pulse, conducts.map<Conduct>(([lane, conduct]) => {
                if(lane < button_generators.length) {
                    return Object.assign(conduct as ButtonConductWithoutLane, {kind: 'button', lane} as const);
                } else {
                    return Object.assign(conduct as LaserConductWithoutLane, {kind: 'laser', lane: (lane - button_generators.length) as LaserLane} as const);
                }
            })];
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

    /** Returns the pulse for the first occurence of any note/laser. */
    getFirstNotePulse(): kson.Pulse {
        return min(
            ...this.note.bt.map((notes) => notes.minKey() ?? 0n),
            ...this.note.fx.map((notes) => notes.minKey() ?? 0n),
            ...this.note.laser.map((notes) => notes.minKey() ?? 0n),
        ) ?? 0n;
    }

    /** Returns the pulse for the end of the last occurence of any note/laser. */
    getLastNotePulse(): kson.Pulse {
        const getLastButtonPulse = (notes: SortedList<kson.ButtonNote>): kson.Pulse => {
            const last_elem = notes.nextLowerPair(void 0);
            if(last_elem == null) return 0n;

            return last_elem[0] + last_elem[1][0];
        };

        const getLastLaserPulse = (notes: SortedList<ChartLaserSection>): kson.Pulse => {
            const last_section = notes.nextLowerPair(void 0);
            if(last_section == null) return 0n;

            return last_section[0] + (last_section[1][0].maxKey() ?? 0n);
        };

        return max(
            ...this.note.bt.map(getLastButtonPulse),
            ...this.note.fx.map(getLastButtonPulse),
            ...this.note.laser.map(getLastLaserPulse),
        ) ?? 0n;
    }

    /** Get the duration of this chart, in milliseconds. */
    getDuration(): number {
        const timing = this.getTiming();
        return timing.getTimeByPulse(this.getLastNotePulse()) - timing.getTimeByPulse(this.getFirstNotePulse());
    }

    /** Get chains for the given range. */
    getChains(range: PulseRange): number {
        return this.getTiming().getChains(range);
    }
    
    getMeasureInfoByIdx(measure_idx: MeasureIdx): MeasureInfo {
        return this.getTiming().getMeasureInfoByIdx(measure_idx);
    }

    getMeasureInfoByPulse(pulse: Pulse): MeasureInfo {
        return this.getTiming().getMeasureInfoByPulse(pulse);
    }

    /**
     * Convert the given pulse to time (in milliseconds).
     * Alias for `this.getTiming().getTimeByPulse(pulse)`.
     */
    getTimeByPulse(pulse: Pulse): number {
        return this.getTiming().getTimeByPulse(pulse);
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

    /* Import/Export */

    /**
     * Set the chart data to given KSON object.
     * @param kson_obj the KSON object, or `null` for fully resetting the chart
     */
    setKSON(kson_obj: Readonly<kson.Kson>|null) {
        if(!kson_obj) kson_obj = kson.schema.Kson.parse({});

        this.version = kson_obj.version;
        this.meta = kson.schema.MetaInfo.parse(kson_obj.meta);
        this.beat = kson.schema.BeatInfo.parse(kson_obj.beat);
        this.note = kson.schema.NoteInfo.parse(kson_obj.note);

        if(kson_obj.gauge != null) this._gauge = kson.schema.GaugeInfo.parse(kson_obj.gauge);
        if(kson_obj.audio != null) this._audio = kson.schema.AudioInfo.parse(kson_obj.audio);
        if(kson_obj.camera != null) this._camera = kson.schema.CameraInfo.parse(kson_obj.camera);
        if(kson_obj.bg != null) this._bg = kson.schema.BGInfo.parse(kson_obj.bg);
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
        return fromKSH(ksh_chart);
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

    toKSH(): ksh.Chart { return toKSH(this); }
    toKSON(): JSONObject { return toKSON(this); }

    export(format: ChartFormat): string {
        switch(format) {
            case 'ksh':  return ksh.Writer.serialize(this.toKSH());
            case 'kson': return JSON.stringify(this.toKSON());
        }
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