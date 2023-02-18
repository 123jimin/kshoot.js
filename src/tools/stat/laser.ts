import type {
    Chart, Timing, Pulse, Conduct, ButtonConduct, LaserConduct, LaserLane
} from "../../chart/index.js";

import { ButtonConductAction, LaserConductAction } from "../../chart/index.js";

import { ButtonLane } from "../../chart/index.js";

const getSameSideLaser = (button_lane: ButtonLane): LaserLane => {
    return button_lane === ButtonLane.BT_A || button_lane === ButtonLane.BT_B || button_lane === ButtonLane.FX_L ? 0 : 1;
}

const getOppositeSideLaser = (button_lane: ButtonLane): LaserLane => {
    return button_lane === ButtonLane.BT_A || button_lane === ButtonLane.BT_B || button_lane === ButtonLane.FX_L ? 1 : 0;
}

export interface LaserOnlyStat {
    /** chains of slant lasers, excluding slams */
    slant_laser_chains: number;
    /** slams; (*, L|R, *) */
    slams: number;

    /** slams without any neighboring lasers; (0, L|R, 0) */
    solo_slams: number;
    /** slams immediately followed by a slant laser in the other direction; (*, L ,R) or (*, R, L) */
    slam_then_triangles: number;
    /** slams preceded and followed by slant lasers in the other directio; (L, R, L) or (R, L, R) */
    slam_jolts: number;

    /** lasers excluding slams, grouped by moving one direction  */
    one_way_moving_lasers: number;
    /** similar to `one_way_moving_lasers`, but a slam would separate the group */
    one_way_moving_uninterrupted_lasers: number;
    /** # of knob touches excluding solo slams */
    moving_lasers: number;
}

export interface OneHandStat {
    /** chips + holds while moving lasers/slams */
    one_hand_notes: number;
    /** chip/holds on the wrong side */
    wrong_side_notes: number;
}

export enum OneHandState {
    None, OneHand, HandTrip,
}

export function getLaserOnlyStat(chart: Chart, timing: Timing): LaserOnlyStat {
    const stat: LaserOnlyStat  = {
        slant_laser_chains: 0, slams: 0,
        solo_slams: 0, slam_then_triangles: 0, slam_jolts: 0,

        one_way_moving_lasers: 0, one_way_moving_uninterrupted_lasers: 0, moving_lasers: 0,
    };

    for(const [pulse, lasers] of chart.laserConducts()) {
        for(const laser of lasers) {
            if(laser.dir_slam) {
                ++stat.slams;

                if('dir_after' in laser && laser.dir_after !== laser.dir_slam) {
                    ++stat.slam_then_triangles;

                    if('dir_before' in laser && laser.dir_before !== laser.dir_slam) {
                        ++stat.slam_jolts;
                    }
                }
            }
            if('length_after' in laser) {
                stat.slant_laser_chains += timing.getChains([pulse, pulse + laser.length_after]);
            }
            switch(laser.action) {
                case LaserConductAction.Slam:
                    ++stat.solo_slams;
                    break;
                case LaserConductAction.Start:
                    ++stat.one_way_moving_lasers;
                    ++stat.one_way_moving_uninterrupted_lasers;
                    ++stat.moving_lasers;
                    break;
                case LaserConductAction.Continue:
                    if(!(laser.dir_before === laser.dir_after && (laser.dir_slam == null || laser.dir_slam == laser.dir_before))) {
                        ++stat.one_way_moving_lasers;
                    }
                    if(!(laser.dir_slam == null && laser.dir_before === laser.dir_after)) {
                        ++stat.one_way_moving_uninterrupted_lasers;                        
                    }
                    break;
            }
        }
    }

    return stat;
}

export function getOneHandStat(chart: Chart, timing: Timing): OneHandStat {
    const stat: OneHandStat = {
        one_hand_notes: 0,
        wrong_side_notes: 0,
    };

    const conductSorter = (priority: (x: Conduct) => number) => (x: Conduct, y: Conduct): number => priority(x) - priority(y);

    type ButtonState = OneHandState | null;
    const button_states: Record<ButtonLane, ButtonState> = [null, null, null, null, null, null];

    const laser_states: Record<LaserLane, boolean> = [false, false];

    for(const [pulse, conducts] of chart.conducts()) {
        conducts.sort(conductSorter((x: Conduct): number => {
            switch(x.kind) {
                case 'laser':
                    switch(x.action) {
                        case LaserConductAction.Slam: return 0;
                        case LaserConductAction.Start: return 1;
                        case LaserConductAction.Continue: return 2;
                        case LaserConductAction.End: return 4;
                    }
                    break;
                case 'button':
                    return 3;
                    break;
            }
        }));

        const is_laser_active: [boolean, boolean] = [laser_states[0], laser_states[1]];

        for(const conduct of conducts) {
            switch(conduct.kind) {
                case 'laser': {
                    for(const button_lane_key in button_states) {
                        const button_lane = (+button_lane_key) as ButtonLane;
                        if(button_states[button_lane] == null)
                            continue;
                        if(button_states[button_lane] === OneHandState.None)
                            button_states[button_lane] = OneHandState.OneHand;
                        if(button_states[button_lane] === OneHandState.OneHand && getSameSideLaser(+button_lane) === conduct.lane)
                            button_states[button_lane] = OneHandState.HandTrip;
                    }
                    switch(conduct.action) {
                        case LaserConductAction.Slam:
                            is_laser_active[conduct.lane] = true
                            break;
                        case LaserConductAction.Start:
                            is_laser_active[conduct.lane] = laser_states[conduct.lane] = true;
                            break;
                        case LaserConductAction.End:
                            is_laser_active[conduct.lane] = laser_states[conduct.lane] = false;
                            break;
                    }
                    break;
                }
                case 'button': {
                    switch(conduct.action) {
                        case ButtonConductAction.Chip:
                            if(is_laser_active[0] || is_laser_active[1]) {
                                ++stat.one_hand_notes;
                            }
                            if(is_laser_active[getSameSideLaser(conduct.lane)]) {
                                ++stat.wrong_side_notes;
                            }
                            break;
                        case ButtonConductAction.HoldStart:
                            button_states[conduct.lane] = is_laser_active[getSameSideLaser(conduct.lane)] ? OneHandState.HandTrip :
                                is_laser_active[getOppositeSideLaser(conduct.lane)] ? OneHandState.OneHand : OneHandState.None; 
                            break;
                        case ButtonConductAction.HoldEnd:
                            switch(button_states[conduct.lane]) {
                                case OneHandState.OneHand:
                                    ++stat.one_hand_notes;
                                    break;
                                case OneHandState.HandTrip:
                                    ++stat.one_hand_notes;
                                    ++stat.wrong_side_notes;
                                    break;
                            }
                            button_states[conduct.lane] = null;
                            break;
                    }
                    break;
                }
            }
        }
    }

    return stat;
}

export function getLaserStat(chart: Chart, timing: Timing): LaserOnlyStat & OneHandStat {
    return {
        ...getLaserOnlyStat(chart, timing),
        ...getOneHandStat(chart, timing),
    };
}