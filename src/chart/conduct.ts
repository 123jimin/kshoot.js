/**
 * Conducts represent a player's action at a moment.
 * For example, a `ButtonObject` for a long note corresponds to two instructions (`HoldStart` and `HoldEnd`).
 */

import * as kson from "../kson/index.js";

import { ButtonLane, type LaserLane } from "./object.js";

type Pulse = kson.Pulse;

/**
 * Actions related to handling button notes
 */
export enum ButtonConductAction {
    Chip, HoldStart, HoldEnd,
}

export interface ButtonConductChip {
    action: ButtonConductAction.Chip;
}

export interface ButtonConductHoldStart {
    action: ButtonConductAction.HoldStart;
    length: Pulse;
}

export interface ButtonConductHoldEnd {
    action: ButtonConductAction.HoldEnd;
    length: Pulse;
}

export type ButtonConductWithoutLane = ButtonConductChip | ButtonConductHoldStart | ButtonConductHoldEnd;
export type ButtonConduct = {lane: ButtonLane} & ButtonConductWithoutLane;

export function* iterateButtonConducts(notes: Iterable<kson.ButtonNote>): Generator<[Pulse, ButtonConductWithoutLane]> {
    for(const [pulse, length] of notes) {
        if(length === 0n) {
            yield [pulse, {action: ButtonConductAction.Chip}];
        } else {
            yield [pulse, {length, action: ButtonConductAction.HoldStart}];
            yield [pulse+length, {length, action: ButtonConductAction.HoldEnd}];
        }
    }
}

export type LaserConductDir = 'L'|'R';

export function getLaserConductDir(graph_value: Readonly<kson.GraphValue>): LaserConductDir|null {
    return graph_value[1] > graph_value[0] ? 'R' : graph_value[1] < graph_value[0] ? 'L' : null;
}

export enum LaserConductAction {
    /** Slam without a slant after or before */
    Slam,
    /** Start laser, possibly with a slam */
    Start,
    /** Either a slam in the middle or a turn in the other direction */
    Continue,
    /** End laser, possibly with a slam */
    End,
}

export interface LaserConductSlam {
    action: LaserConductAction.Slam;
    dir_slam: LaserConductDir;
}

export interface LaserConductStart {
    action: LaserConductAction.Start;
    length_after: Pulse;
    dir_slam?: LaserConductDir;
    dir_after: LaserConductDir;
}

export interface LaserConductContinue {
    action: LaserConductAction.Continue;
    length_before: Pulse;
    length_after: Pulse;
    // It is gauranteed that dir_before === dir_after && dir_slam == null will never be satisfied.
    dir_before: LaserConductDir;
    dir_slam?: LaserConductDir;
    dir_after: LaserConductDir;
}

export interface LaserConductEnd {
    action: LaserConductAction.End;
    length_before: Pulse;
    dir_before: LaserConductDir;
    dir_slam?: LaserConductDir;
}

export type LaserConductWithoutLane = LaserConductSlam | LaserConductStart | LaserConductContinue | LaserConductEnd;
export type LaserConduct = {lane: LaserLane} & LaserConductWithoutLane;

export function* iterateLaserConducts(sections: kson.LaserSections): Generator<[Pulse, LaserConductWithoutLane]> {
    let prev_state: {
        pulse: Pulse;
        length_before: Pulse;
        dir_before: LaserConductDir|null;
        dir_slam: LaserConductDir|null;
        graph_value: kson.GraphValue;
    }|null = null;

    const process = (pulse: Pulse, next_laser: kson.GraphValue|null): [Pulse, LaserConductWithoutLane]|null => {
        if(prev_state == null) {
            if(next_laser != null) {
                prev_state = {
                    pulse,
                    length_before: 0n,
                    dir_before: null,
                    dir_slam: getLaserConductDir(next_laser),
                    graph_value: next_laser,
                };
            }
            return null;
        }

        const {pulse: prev_pulse, length_before, dir_before, dir_slam, graph_value: prev_graph_value} = prev_state;
        const dir_after = next_laser == null ? null : getLaserConductDir([prev_graph_value[1], next_laser[0]]);
        const length_after = pulse - prev_pulse;

        if(next_laser == null) {
            prev_state = null;
        } else {
            prev_state = {
                pulse,
                length_before: pulse - prev_pulse,
                dir_before: dir_after,
                dir_slam: getLaserConductDir(next_laser),
                graph_value: next_laser,
            };
        }
        
        if(dir_before == null && dir_after == null) {
            if(dir_slam == null) return null;
            else return [prev_pulse, {action: LaserConductAction.Slam, dir_slam}];
        }

        if(dir_before == null) {
            if(dir_slam == null) return [prev_pulse, {action: LaserConductAction.Start, length_after, dir_after: dir_after as LaserConductDir}];
            else return [prev_pulse, {action: LaserConductAction.Start, length_after, dir_slam, dir_after: dir_after as LaserConductDir}];
        }

        if(dir_after == null) {
            if(dir_slam == null) return [prev_pulse, {action: LaserConductAction.End, length_before, dir_before: dir_before as LaserConductDir}];
            else return [prev_pulse, {action: LaserConductAction.End, length_before, dir_slam, dir_before: dir_before as LaserConductDir}];
        }

        if(prev_state == null) throw new Error("Invalid internal state!"); // dir_after is not null => next_laser is not null => prev_state is not null

        if(dir_slam) return [prev_pulse, {action: LaserConductAction.Continue, length_before, length_after, dir_before, dir_slam, dir_after}];

        if(dir_before === dir_after) {
            prev_state.length_before += length_before;
            return null;
        }

        return [prev_pulse, {action: LaserConductAction.Continue, length_before, length_after, dir_before, dir_after}];
    }

    for(const [section_pulse, section_points] of sections) {
        const conduct_from_prev_section = process(0n, null);
        if(conduct_from_prev_section) yield conduct_from_prev_section;

        for(const [relative_pulse, graph_value] of section_points) {
            const pulse = section_pulse + relative_pulse;
            const conduct = process(pulse, graph_value);
            if(conduct) yield conduct;
        }
    }

    const last_conduct = process(0n, null);
    if(last_conduct) yield last_conduct;
}

export type Conduct = (ButtonConduct & {kind: 'button'}) | (LaserConduct & {kind: 'laser'});