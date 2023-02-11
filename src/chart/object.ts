import * as kson from "../kson/index.js";

export interface MeasureInfo {
    idx: kson.MeasureIdx;
    pulse: kson.Pulse;
    time_sig: Readonly<kson.TimeSig>;
    length: kson.Pulse;
    beat_length: kson.Pulse;
}

export interface TimingInfo {
    pulse: kson.Pulse;
    /** Time from the beginning of the chart, in milliseconds. */
    time: number;
    bpm: number;
    measure: MeasureInfo;
}

export enum NoteLane {
    BT_A, BT_B, BT_C, BT_D,
    FX_L, FX_R,
}

export interface ButtonObject {
    lane: NoteLane;
    length: kson.Pulse;
}

export interface LaserObject {
    section_pulse: kson.Pulse;
    lane: 0|1; width: number;
    length: kson.Pulse;
    v: Readonly<kson.GraphValue>,
    curve: Readonly<kson.GraphCurveValue>,
}

/** Notes and lasers */
export type NoteObject = ButtonObject | LaserObject;
export type ChartObject = NoteObject;