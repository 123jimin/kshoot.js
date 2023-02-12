import { PULSES_PER_WHOLE, NoteLane } from "../chart/index.js";
import type {
    Chart, Pulse, ButtonObject, LaserObject,
} from "../chart/index.js";

interface NoteOnlyStat {
    /** chip amount */
    chips: number;
    /** hold amount */
    holds: number;
    /** chips + holds */
    notes: number;
    /** max density of chip/holds within 4 whole notes */
    max_density: number;
}

interface LaserOnlyStat {
    /** moving lasers, excluding slams */
    moving_lasers: number;
    /** slams */
    slams: number;
}

interface OneHandStat {
    /** chips + holds while moving lasers/slams */
    one_hand_notes: number;
    /** chip/holds on the wrong side */
    wrong_side_notes: number;
}

export interface Stat extends NoteOnlyStat, LaserOnlyStat, OneHandStat {
}

export interface Radar {
    notes: number;
    peak: number;
    tsumami: number;
    one_hand: number;
    hand_trip: number;
    tricky: number;
}

export function getNoteOnlyStat(chart: Chart): NoteOnlyStat {
    const DENSITY_WINDOW = 4n * PULSES_PER_WHOLE;

    const stat: NoteOnlyStat = {
        chips: 0, holds: 0, notes: 0,
        max_density: 0,
    };

    const front_button_note_it = chart.buttonNotes();
    let front_button_notes: [Pulse, ButtonObject[]]|undefined = front_button_note_it.next().value;
    if(front_button_notes == null) {
        return stat;
    }

    const back_button_note_it = chart.buttonNotes();
    let back_button_notes: [Pulse, ButtonObject[]] = back_button_note_it.next().value;

    // Notes between [back_button_note, front_button_note], inclusive
    let curr_notes_inbetween = 0;
    while(front_button_notes) {
        for(const button of front_button_notes[1]) {
            ++stat.notes; ++curr_notes_inbetween;
            if(button.length > 0n) ++stat.holds;
            else ++stat.chips;
        }

        while(back_button_notes[0] + DENSITY_WINDOW < front_button_notes[0]) {
            curr_notes_inbetween -= back_button_notes[1].length;
            back_button_notes = back_button_note_it.next().value;
        }

        if(curr_notes_inbetween > stat.max_density) {
            stat.max_density = curr_notes_inbetween;
        }

        front_button_notes = front_button_note_it.next().value;
    }

    return stat;
}

const isOnSide = (note_lane: NoteLane, laser_lane: number): boolean => {
    switch(note_lane) {
        case NoteLane.BT_A: return laser_lane === 0;
        case NoteLane.BT_B: return laser_lane === 0;
        case NoteLane.BT_C: return laser_lane === 1;
        case NoteLane.BT_D: return laser_lane === 1;
        case NoteLane.FX_L: return laser_lane === 0;
        case NoteLane.FX_R: return laser_lane === 1;
    }
}

export function getLaserStat(chart: Chart): LaserOnlyStat & OneHandStat {
    const stat: LaserOnlyStat & OneHandStat = {
        moving_lasers: 0, slams: 0, one_hand_notes: 0, wrong_side_notes: 0,
    };
    
    const laser_note_it = chart.laserNotes();
    let laser_notes: [Pulse, LaserObject[]]|undefined = laser_note_it.next().value;
    if(laser_notes == null) {
        return stat;
    }

    let prev_laser_notes: [[Pulse, LaserObject]|null, [Pulse, LaserObject]|null] = [null, null];
    
    const button_note_it = chart.buttonNotes();
    let button_notes: [Pulse, ButtonObject[]]|undefined = button_note_it.next().value;
    const hold_ends: [Pulse, Pulse, Pulse, Pulse, Pulse, Pulse] = [-1n, -1n, -1n, -1n, -1n, -1n];

    while(laser_notes) {
        // TODO: calculate one hand stats
        for(const laser_note of laser_notes[1]) {
            if(laser_note.v[0] !== laser_note.v[1]) ++stat.slams;
            if(laser_note.v[1] !== laser_note.ve && laser_note.length > 0n) {
                let prev_dir: -1|0|1 = 0;

                const prev_laser_note = prev_laser_notes[laser_note.lane];
                if(prev_laser_note && prev_laser_note[0] + prev_laser_note[1].length === laser_notes[0]) {
                    if(prev_laser_note[1].v[1] < prev_laser_note[1].ve) prev_dir = 1; 
                    else if(prev_laser_note[1].v[1] > prev_laser_note[1].ve) prev_dir = -1; 
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

export function getStat(chart: Chart): Stat {
    const stat: Stat = {
        ...getNoteOnlyStat(chart),
        ...getLaserStat(chart),
    }

    return stat;
}

export function getRadar(chart: Chart): Radar {
    const stat = getStat(chart);

    return {
        notes: stat.notes,
        peak: stat.max_density,
        tsumami: stat.moving_lasers + stat.slams,
        one_hand: stat.one_hand_notes,
        hand_trip: stat.wrong_side_notes,
        tricky: 0,
    };
}