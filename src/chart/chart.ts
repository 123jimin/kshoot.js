import type {z} from 'zod';

import * as ksh from "../ksh/index.js";
import * as kson from "../kson/index.js";
import {default as readKSH} from "./read-ksh.js";

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