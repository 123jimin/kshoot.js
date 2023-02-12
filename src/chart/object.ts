import * as kson from "../kson/index.js";

export interface MeasureInfo {
    /** `measure_idx` for this measure */
    idx: kson.MeasureIdx;
    /** Beginning of this measure */
    pulse: kson.Pulse;
    /** Time signature for this measure, in [numerator, denominator] */
    time_sig: Readonly<kson.TimeSig>;
    /** Length of this measure, in pulses */
    length: kson.Pulse;
    /** Beat length of this measure, in pulses */
    beat_length: kson.Pulse;
}

/** Contains various timing informations for one point */
export interface TimingInfo {
    pulse: kson.Pulse;
    /** Time from the beginning of the chart, in milliseconds. */
    time: number;
    /** BPM at this moment */
    bpm: number;
    /** Informations on the measure at this moment */
    measure: MeasureInfo;
}

export enum NoteLane {
    BT_A, BT_B, BT_C, BT_D,
    FX_L, FX_R,
}

/** One button, either short (length === 0n) or long (length > 0n). */
export interface ButtonObject {
    lane: NoteLane;
    length: kson.Pulse;
}

/** One laser segment (optional 1 slam + 1 slant/curve) */
export interface LaserObject {
    /** Beginning of the entire section of laser containing this segment */
    section_pulse: kson.Pulse;
    lane: 0|1; width: number;
    /** Length of this laser segment */
    length: kson.Pulse;
    /** Start position, with an optional slam (when `v[0] !== v[1]`) */
    v: Readonly<kson.GraphValue>,
    /** End position */
    ve: number,
    /** Curve parameter */
    curve: Readonly<kson.GraphCurveValue>,
}

/** Notes and lasers */
export type NoteObject = ButtonObject | LaserObject;
export type ChartObject = NoteObject;