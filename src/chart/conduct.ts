/**
 * Conducts represent a player's movement at a moment.
 * For example, a `ButtonObject` for a long note corresponds to two instructions (`HoldStart` and `HoldEnd`).
 */

import * as kson from "../kson/index.js";

import { NoteLane, type LaserLane } from "./object.js";

type Pulse = kson.Pulse;

function isSlam(graph_value: Readonly<kson.GraphValue>): boolean {
    return graph_value[0] !== graph_value[1];
}

/**
 * Types for {@link Button}
 */
export enum ButtonConductAction {
    Chip, HoldStart, HoldEnd,
}

/**
 * Actions related to handling button notes
 */
export interface ButtonConduct {
    lane: NoteLane;
    action: ButtonConductAction;
    length: Pulse;
}

export function* iterateButtonConducts(notes: Iterable<kson.ButtonNote>): Generator<[Pulse, Omit<ButtonConduct, 'lane'>]> {
    for(const [pulse, length] of notes) {
        if(length === 0n) {
            yield [pulse, {length, action: ButtonConductAction.Chip}];
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
    /**
     * Slam; `(before, slam, after)` MUST be `(void, L|R, void)`
     */
    Slam,
    /**
     * Start turning; `(before, slam, after)` MUST be `(void, any, L|R)`
     * - `slam == void`: Start turning with a slant (and continuing)
     * - `slam == after`: Start turning with a slam (and continuing in the same direction)
     * - `slam != after`: Start turning with a slam then in the opposite direction (hard triangle)
     */
    Start,
    /**
     * Continue turning; `(before, slam, after)` MUST be `(L|R, any, L|R)` and can't be `(L, void, L)` or `(R, void, R)`
     * - `slam == void`: Folded slanted laser
     * - `before == slam == after`: Insignificant slam
     * - `before == after but != slam`: Lightning bolt-shaped jolt
     * - `before == slam and slam != after`: Slam then turn in the opposite direction (hard triangle)
     * - `before != slam and slam == after`: Slam in the opposite direction and keep turning
     */
    Continue,
    /**
     * End turning; `(before, slam, after)` MUST be `(L|R, any, void)`
     * - `slam == void`: End turning with a slant
     * - `slam == before`: End turning with a slam
     * - `slam != before`: End turning with a slam (easy triangle)
     */
    End,
}

export interface LaserConduct {
    lane: LaserLane;
    action: LaserConductAction;
    dir_before?: LaserConductDir;
    dir_slam?: LaserConductDir;
    dir_after?: LaserConductDir;
}

export function* iterateLaserConducts(sections: kson.LaserSections): Generator<[Pulse, Omit<LaserConduct, 'lane'>]> {
    let prev_pulse: Pulse = 0n;

    let prev_state: {
        dir_before: LaserConductDir|null;
        dir_slam: LaserConductDir|null;
        graph_value: kson.GraphValue;
    }|null = null;

    const process = (next_laser: kson.GraphValue|null): Omit<LaserConduct, 'kind'|'lane'>|null => {
        if(prev_state == null) {
            if(next_laser != null) {
                prev_state = {
                    dir_before: null,
                    dir_slam: getLaserConductDir(next_laser),
                    graph_value: next_laser,
                };
            }
            return null;
        }

        const {dir_before, dir_slam, graph_value: prev_graph_value} = prev_state;
        const dir_after = next_laser == null ? null : getLaserConductDir([prev_graph_value[1], next_laser[0]]);

        if(next_laser == null) {
            prev_state = null;
        } else {
            prev_state = {
                dir_before: dir_after,
                dir_slam: getLaserConductDir(next_laser),
                graph_value: next_laser,
            };
        }
        
        if(dir_before == null && dir_after == null) {
            if(dir_slam == null) return null;
            else return {action: LaserConductAction.Slam, dir_slam};
        }

        if(dir_before == null) {
            if(dir_slam == null) return {action: LaserConductAction.Start, dir_after: dir_after as LaserConductDir};
            else return {action: LaserConductAction.Start, dir_slam, dir_after: dir_after as LaserConductDir};
        }

        if(dir_after == null) {
            if(dir_slam == null) return {action: LaserConductAction.End, dir_before: dir_before as LaserConductDir};
            else return {action: LaserConductAction.End, dir_slam, dir_before: dir_before as LaserConductDir};
        }

        if(dir_slam == null) return {action: LaserConductAction.Continue, dir_before, dir_after};
        else return {action: LaserConductAction.Continue, dir_before, dir_slam, dir_after};
    }

    for(const [section_pulse, section_points] of sections) {
        const action_from_prev_section = process(null);
        if(action_from_prev_section) yield [prev_pulse, action_from_prev_section];

        for(const [relative_pulse, graph_value] of section_points) {
            const pulse = section_pulse + relative_pulse;
            const action = process(graph_value);
            if(action) yield [pulse, action];
            prev_pulse = pulse;
        }
    }

    const last_action = process(null);
    if(last_action) yield [prev_pulse, last_action];
}

export type Conduct = (ButtonConduct & {kind: 'button'}) | (LaserConduct & {kind: 'laser'});