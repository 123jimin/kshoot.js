import * as ksh from "./ksh/index.js";
import * as kson from "./kson/index.js";
import {default as ksh2kson} from "./convert-ksh-kson.js";

export class Chart implements kson.Kson {
    version: string = kson.VERSION;
    meta: kson.MetaInfo;
    beat: kson.BeatInfo;
    gauge: kson.GaugeInfo;
    note: kson.NoteInfo;
    editor: kson.EditorInfo;

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
    }

    /**
     * Reads the given KSH chart.
     * @param chart_str a string representing the chart (with or without the BOM)
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
        const chart_obj = (typeof chart_data === 'string' ? JSON.parse(chart_data) : chart_data);
        return new Chart(kson.schema.Kson.parse(chart_obj));
    }
}