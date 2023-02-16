import type {
    Chart, Pulse, ButtonObject, LaserObject,
} from "../../chart/index.js";

import {isOnSide} from "./util.js";

export interface LaserOnlyStat {
    /** moving lasers, excluding slams */
    moving_lasers: number;
    /** chains of moving lasers, excluding slams */
    moving_laser_chains: number;
    /** slams */
    slams: number;
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

export function getLaserStat(chart: Chart): LaserOnlyStat & OneHandStat {
    const stat: LaserOnlyStat & OneHandStat = {
        moving_lasers: 0, moving_laser_chains: 0, slams: 0,
        one_hand_notes: 0, wrong_side_notes: 0,
    };
    
    const laser_note_it = chart.laserNotes();
    let laser_notes: [Pulse, LaserObject[]]|undefined = laser_note_it.next().value;
    if(laser_notes == null) {
        return stat;
    }

    // Previous laser notes, for each lane
    const prev_laser_notes: [[Pulse, LaserObject]|null, [Pulse, LaserObject]|null] = [null, null];
    
    const button_note_it = chart.buttonNotes();
    let button_notes: [Pulse, ButtonObject[]]|undefined = button_note_it.next().value;

    // End time and one hand states for notes
    const note_ends: [Pulse, Pulse, Pulse, Pulse, Pulse, Pulse] = [-1n, -1n, -1n, -1n, -1n, -1n];
    const one_hand_states: [OneHandState, OneHandState, OneHandState, OneHandState, OneHandState, OneHandState]
        = [OneHandState.None, OneHandState.None, OneHandState.None, OneHandState.None, OneHandState.None, OneHandState.None];

    while(laser_notes) {
        for(const laser_note of laser_notes[1]) {
            const is_slam = laser_note.v[0] !== laser_note.v[1];

            // Insignificant laser
            if(!is_slam && laser_note.v[1] === laser_note.ve) continue;

            const eff_laser_len = laser_note.v[1] === laser_note.ve ? 0n : laser_note.length;

            // Check previously held notes
            for(let i=0; i<6; ++i) {
                if(note_ends[i] < laser_notes[0]) continue;
                if(one_hand_states[i] === OneHandState.HandTrip) continue;

                // Actually at this stage, one_hand_states[i] === OneHandState.OneHand...

                // One-hand note checking
                if(isOnSide(i, laser_note.lane)) {
                    if(one_hand_states[i] === OneHandState.None) {
                        one_hand_states[i] = OneHandState.OneHand;
                        ++stat.one_hand_notes;
                    }
                } else {
                    if(one_hand_states[i] === OneHandState.None) {
                        ++stat.one_hand_notes;
                        ++stat.wrong_side_notes;
                    } else if(one_hand_states[i] === OneHandState.OneHand) {
                        ++stat.wrong_side_notes;
                    }
                    one_hand_states[i] = OneHandState.HandTrip;
                }
            }

            // Calculate one-hand stats; note that the end condition <= is needed to check notes at the end of the laser
            while(button_notes && (button_notes[0] <= laser_notes[0] + eff_laser_len)) {
                for(const button_note of button_notes[1]) {
                    note_ends[button_note.lane] = button_notes[0] + button_note.length;

                    if(button_notes[0] + button_note.length < laser_notes[0]) {
                        one_hand_states[button_note.lane] = OneHandState.None;
                        continue;
                    }

                    const wrong_side = !isOnSide(button_note.lane, laser_note.lane);

                    ++stat.one_hand_notes;
                    if(wrong_side) ++stat.wrong_side_notes;

                    one_hand_states[button_note.lane] = wrong_side ? OneHandState.HandTrip : OneHandState.OneHand;
                }

                button_notes = button_note_it.next().value;
            }

            if(is_slam) ++stat.slams;
            
            if(laser_note.v[1] !== laser_note.ve && laser_note.length > 0n) {
                stat.moving_laser_chains += chart.getChains([laser_notes[0], laser_notes[0] + laser_note.length]);

                let prev_dir: -1|0|1 = 0;

                if(!is_slam) {
                    const prev_laser_note = prev_laser_notes[laser_note.lane];
                    if(prev_laser_note && prev_laser_note[0] + prev_laser_note[1].length === laser_notes[0]) {
                        if(prev_laser_note[1].v[1] < prev_laser_note[1].ve) prev_dir = 1; 
                        else if(prev_laser_note[1].v[1] > prev_laser_note[1].ve) prev_dir = -1; 
                    }
                }

                if(laser_note.v[1] < laser_note.ve && prev_dir !== 1 || laser_note.v[1] > laser_note.ve && prev_dir !== -1) {
                    ++stat.moving_lasers;
                }
            }

            prev_laser_notes[laser_note.lane] = [laser_notes[0], laser_note];
        }
        laser_notes = laser_note_it.next().value;
    }

    return stat;
}