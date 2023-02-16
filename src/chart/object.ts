import * as kson from "../kson/index.js";

export enum NoteLane {
    BT_A, BT_B, BT_C, BT_D,
    FX_L, FX_R,
}

export type LaserLane = 0|1;

/** One button, either short (length === 0n) or long (length > 0n). */
export interface ButtonObject {
    lane: NoteLane;
    length: kson.Pulse;
}

/** One laser segment (optional 1 slam + 1 slant/curve) */
export interface LaserObject {
    /** Beginning of the entire section of laser containing this segment */
    section_pulse: kson.Pulse;
    lane: LaserLane; width: number;
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