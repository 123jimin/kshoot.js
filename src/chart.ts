import * as ksh from "./ksh/index.js";
import * as kson from "./kson/index.js";
import {default as ksh2kson} from "./convert-ksh-kson.js";

export class Chart implements kson.Kson {
    version: string = kson.VERSION;
    meta: kson.MetaInfo;
    beat: kson.BeatInfo;
    gauge: kson.GaugeInfo;
    note: kson.NoteInfo;
    audio?: kson.AudioInfo;
    camera?: kson.CameraInfo;
    bg?: kson.BGInfo;
    editor: kson.EditorInfo;
    compat?: kson.CompatInfo;
    impl?: unknown;

    /**
     * Creates a chart object, optionally initialized to given KSON data.
     * @param [kson_obj] Initial KSON data (**this will be shallow-copied**)
     */
    constructor(kson_obj?: Readonly<kson.Kson>) {
        if(!kson_obj) kson_obj = kson.schema.Kson.parse({});

        ({
            version: this.version,
            meta: this.meta,
            beat: this.beat,
            gauge: this.gauge,
            note: this.note,
            editor: this.editor,
        } = kson_obj);

        if(kson_obj.audio != null) this.audio = kson_obj.audio;
        if(kson_obj.camera != null) this.camera = kson_obj.camera;
        if(kson_obj.bg != null) this.bg = kson_obj.bg;
        if(kson_obj.compat != null) this.compat = kson_obj.compat;
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
        const kson_chart = ksh2kson(ksh_chart);
        return new Chart(kson_chart);
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