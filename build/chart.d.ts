import * as Kson from "./kson.js";
export declare class Chart implements Kson.Kson {
    version: string;
    meta: Kson.MetaInfo;
    beat: Kson.BeatInfo;
    constructor();
    /**
     * Reads the given KSH chart.
     * @param chart_str a string representing the chart (with or without the BOM)
     * @returns parsed chart data
     * @throws when the given string represents an invalid KSH chart
     */
    static parseKSH(chart_str: string): Chart;
    /**
     * Reads the given KSON chart.
     * @param chart_obj a string or an object representing the chart file
     * @returns parsed chart data
     * @throws when the given argument represents an invalid KSON chart
     */
    static parseKSON(chart_obj: string | object): Chart;
}
