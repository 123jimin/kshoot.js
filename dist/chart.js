import * as Kson from "./kson/index.js";
export class Chart {
    version = Kson.VERSION;
    meta;
    beat;
    gauge;
    note;
    editor;
    /**
     * Creates a chart object, optionally initialized to given KSON data.
     * @param [kson] Initial KSON data (**this will be shallow-copied**)
     */
    constructor(kson) {
        if (!kson)
            kson = Kson.Schema.Kson.parse({});
        this.version = kson.version;
        this.meta = kson.meta;
        this.beat = kson.beat;
        this.gauge = kson.gauge;
        this.note = kson.note;
        this.editor = kson.editor;
    }
    /**
     * Reads the given KSH chart.
     * @param chart_str a string representing the chart (with or without the BOM)
     * @returns parsed chart data
     * @throws when the given string represents an invalid KSH chart
     */
    static parseKSH(chart_str) {
        return new Chart();
    }
    /**
     * Reads the given KSON chart.
     * @param chart_obj a string or an object representing the chart file
     * @returns parsed chart data
     * @throws when the given argument represents an invalid KSON chart
     */
    static parseKSON(chart_obj) {
        if (typeof chart_obj === 'string') {
            return this.parseKSON(JSON.parse(chart_obj));
        }
        else {
            return new Chart(Kson.Schema.Kson.parse(chart_obj));
        }
    }
}
