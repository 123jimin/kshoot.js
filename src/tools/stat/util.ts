import { iterateAll } from "../../util.js";
import { NoteLane, type LaserLane } from "../../chart/index.js";
import type { Chart, Pulse } from "../../chart/index.js";
import * as kson from "../../kson/index.js";

export const isOnSide = (note_lane: NoteLane, laser_lane: number): boolean => {
    switch(note_lane) {
        case NoteLane.BT_A: return laser_lane === 0;
        case NoteLane.BT_B: return laser_lane === 0;
        case NoteLane.BT_C: return laser_lane === 1;
        case NoteLane.BT_D: return laser_lane === 1;
        case NoteLane.FX_L: return laser_lane === 0;
        case NoteLane.FX_R: return laser_lane === 1;
    }
}

export enum ButtonActionKind {
    Chip, HoldStart, HoldEnd,
}

export interface ButtonAction {
    lane: NoteLane;
    length: Pulse;
    kind: ButtonActionKind;
}

export function* iterateButtonActions(chart: Chart): Generator<[pulse: Pulse, actions: ButtonAction[]]> {
    const generators: Generator<[Pulse, Omit<ButtonAction, 'lane'>]>[] = [...chart.note.bt, ...chart.note.fx].map(
        function* (notes: Iterable<kson.ButtonNote>): Generator<[Pulse, Omit<ButtonAction, 'lane'>]> {
            for(const [pulse, length] of notes) {
                if(length === 0n) {
                    yield [pulse, {length, kind: ButtonActionKind.Chip}];
                } else {
                    yield [pulse, {length, kind: ButtonActionKind.HoldStart}];
                    yield [pulse+length, {length, kind: ButtonActionKind.HoldEnd}];
                }
            }
        }
    );

    for(const [pulse, actions] of iterateAll<[Pulse, Omit<ButtonAction, 'lane'>]>(...generators)) {
        yield [pulse, actions.map(([lane, action]) => Object.assign(action, {lane}))];
    }
}

export type LaserActionDir = 'L' | 'R';

export function getLaserActionDir(graph_value: Readonly<kson.GraphValue>): LaserActionDir|null {
    return graph_value[1] > graph_value[0] ? 'R' : graph_value[1] < graph_value[0] ? 'L' : null;
}

export function isSlam(graph_value: Readonly<kson.GraphValue>): boolean {
    return graph_value[0] !== graph_value[1];
}

export enum LaserActionKind {
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

export interface LaserAction {
    lane: LaserLane;
    kind: LaserActionKind;
    dir_before?: LaserActionDir;
    dir_slam?: LaserActionDir;
    dir_after?: LaserActionDir;
}

export function* iterateLaserActions(chart: Chart): Generator<[pulse: Pulse, actions: LaserAction[]]> {
    const generators: Generator<[Pulse, Omit<LaserAction, 'lane'>]>[] = chart.note.laser.map(
        function* (sections: kson.LaserSections): Generator<[Pulse, Omit<LaserAction, 'lane'>]> {
            let prev_pulse: Pulse = 0n;

            let prev_state: {
                dir_before: LaserActionDir|null;
                dir_slam: LaserActionDir|null;
                graph_value: kson.GraphValue;
            }|null = null;

            const process = (next_laser: kson.GraphValue|null): Omit<LaserAction, 'lane'>|null => {
                if(prev_state == null) {
                    if(next_laser != null) {
                        prev_state = {
                            dir_before: null,
                            dir_slam: getLaserActionDir(next_laser),
                            graph_value: next_laser,
                        };
                    }
                    return null;
                }

                const {dir_before, dir_slam, graph_value: prev_graph_value} = prev_state;
                const dir_after = next_laser == null ? null : getLaserActionDir([prev_graph_value[1], next_laser[0]]);

                if(next_laser == null) {
                    prev_state = null;
                } else {
                    prev_state = {
                        dir_before: dir_after,
                        dir_slam: getLaserActionDir(next_laser),
                        graph_value: next_laser,
                    };
                }
                
                if(dir_before == null && dir_after == null) {
                    if(dir_slam == null) return null;
                    else return {kind: LaserActionKind.Slam, dir_slam};
                }

                if(dir_before == null) {
                    if(dir_slam == null) return {kind: LaserActionKind.Start, dir_after: dir_after as LaserActionDir};
                    else return {kind: LaserActionKind.Start, dir_slam, dir_after: dir_after as LaserActionDir};
                }

                if(dir_after == null) {
                    if(dir_slam == null) return {kind: LaserActionKind.End, dir_before: dir_before as LaserActionDir};
                    else return {kind: LaserActionKind.End, dir_slam, dir_before: dir_before as LaserActionDir};
                }

                if(dir_slam == null) return {kind: LaserActionKind.Continue, dir_before, dir_after};
                else return {kind: LaserActionKind.Continue, dir_before, dir_slam, dir_after};
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
    );
    
    for(const [pulse, actions] of iterateAll<[Pulse, Omit<LaserAction, 'lane'>]>(...generators)) {
        yield [pulse, actions.map(([lane, action]) => Object.assign(action, {lane: lane as LaserLane}))];
    }
}