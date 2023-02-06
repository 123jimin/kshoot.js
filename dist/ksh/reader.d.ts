import { Line, CommentLine, OptionLine, ChartLine, AudioEffectLine, UnknownLine } from "./type.js";
export interface Measure {
    /** Time signature of this measure */
    time_signature: [numerator: number, denominator: number];
    /** Starting time of this measure */
    pulse: bigint;
    /** Length of this measure, in pulses */
    length: bigint;
    /** Chart lines, where each chart line is grouped with accompanying comments and options */
    lines: {
        pulse: bigint;
        comments: CommentLine[];
        options: OptionLine[];
        chart: ChartLine;
    }[];
}
/**
 * A class for reading KSH chart data
 */
export default class Reader {
    /** Unrecognized lines */
    unknown: {
        header: OptionLine[];
        body: [pulse: bigint, line: OptionLine | UnknownLine][];
    };
    /** Header options for this chart */
    header: OptionLine[];
    /** Body of this chart, grouped by measures */
    body: Measure[];
    /** Audio effects defined in this chart */
    audio_effects: AudioEffectLine[];
    private _curr_pulse;
    private _curr_pulses_per_measure;
    private _curr_time_signature;
    private _handleHeader;
    private _setTimeSignature;
    private _handleMeasure;
    private _addUnknown;
    /**
     * Parses the given KSH chart.
     * @param chart_str a string representing the chart (with or without the BOM)
     * @returns Parsed data
     * @throws when the chart is malformed
     */
    static parse(chart_str: string): Readonly<Reader>;
    /**
     * Parses one line from the KSH chart.
     * @param line One line from a chart
     * @returns Parsed line
     */
    static parseLine(line: string): Line;
}
