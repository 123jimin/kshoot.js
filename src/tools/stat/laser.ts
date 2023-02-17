import type {
    Chart, Timing, Pulse, ButtonConduct, LaserConduct, LaserLane
} from "../../chart/index.js";

import { LaserConductAction } from "../../chart/index.js";

import { ButtonLane } from "../../chart/index.js";

const isOnSide = (button_lane: ButtonLane, laser_lane: LaserLane): boolean => {
    switch(button_lane) {
        case ButtonLane.BT_A: return laser_lane === 0;
        case ButtonLane.BT_B: return laser_lane === 0;
        case ButtonLane.BT_C: return laser_lane === 1;
        case ButtonLane.BT_D: return laser_lane === 1;
        case ButtonLane.FX_L: return laser_lane === 0;
        case ButtonLane.FX_R: return laser_lane === 1;
    }
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

    // TODO: implement it

    const button_conduct_it = chart.buttonConducts();
    let button_conduct: [Pulse, ButtonConduct[]]|undefined = button_conduct_it.next().value;

    const laser_conduct_it = chart.laserConducts();
    let laser_conduct: [Pulse, LaserConduct[]]|undefined = laser_conduct_it.next().value;

    const progressButton = (): void => {
        button_conduct = button_conduct_it.next().value;
    };

    const progressLaser = (): void => {
        laser_conduct = laser_conduct_it.next().value;
    };

    while(button_conduct || laser_conduct) {
        if(laser_conduct == null) {
            while(button_conduct) {
                progressButton();
            }
            break;
        }

        if(button_conduct == null) {
            while(laser_conduct) {
                progressLaser();
            }
            break;
        }

        if(button_conduct[0] < laser_conduct[0]) {
            while(button_conduct && button_conduct[0] < laser_conduct[0]) {
                progressButton();
            }
            continue;
        }

        if(laser_conduct[0] < button_conduct[0]) {
            while(laser_conduct && laser_conduct[0] < button_conduct[0]) {
                progressLaser();
            }
            continue;
        }
        
        button_conduct = button_conduct_it.next().value;
        laser_conduct = laser_conduct_it.next().value;
    }

    return stat;
}

export function getLaserStat(chart: Chart, timing: Timing): LaserOnlyStat & OneHandStat {
    return {
        ...getLaserOnlyStat(chart, timing),
        ...getOneHandStat(chart, timing),
    };
}