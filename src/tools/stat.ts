import { PULSES_PER_WHOLE, NoteLane } from "../chart/index.js";
import type {
    Chart, Pulse, ButtonObject, LaserObject,
    TimingInfo,
} from "../chart/index.js";

// 130BPM 16ths
const MAX_JACK_INTERVAL = 15_000 / 130;

const DENSITY_WINDOW = 4n * PULSES_PER_WHOLE;

interface NoteCountStat {
    /** \# of short notes */
    chips: number;
    /** \# of long notes */
    holds: number;
    /** \# of chains for long notes */
    hold_chains: number;
    /** `chips` + `holds` */
    notes: number;
    /** `chips` + `hold_chains` */
    note_chains: number;

    jacks: number;
}

function createNoteCountStat(): NoteCountStat { return {chips: 0, holds: 0, hold_chains: 0, notes: 0, note_chains: 0, jacks: 0}; }

interface NoteOnlyStat extends NoteCountStat {
    by_lane: [NoteCountStat, NoteCountStat, NoteCountStat, NoteCountStat, NoteCountStat, NoteCountStat];
    /** max density of chip/holds within 4 whole notes */
    max_density: number;
    max_density_range: [begin: Pulse, end: Pulse];
}

interface LaserOnlyStat {
    /** moving lasers, excluding slams */
    moving_lasers: number;
    /** chains of moving lasers, excluding slams */
    moving_laser_chains: number;
    /** slams */
    slams: number;
}

interface OneHandStat {
    /** chips + holds while moving lasers/slams */
    one_hand_notes: number;
    /** chip/holds on the wrong side */
    wrong_side_notes: number;
}

interface BeatStat {
    bpm_changes: number;
    bpm_change_intensity: number;
}

export interface Stat extends NoteOnlyStat, LaserOnlyStat, OneHandStat, BeatStat {}

export function getNoteOnlyStat(chart: Chart): NoteOnlyStat {
    const stat: NoteOnlyStat = {
        ...createNoteCountStat(),
        by_lane: [createNoteCountStat(), createNoteCountStat(), createNoteCountStat(), createNoteCountStat(), createNoteCountStat(), createNoteCountStat()],
        max_density: 0, max_density_range: [0n, 0n],
    };

    const front_button_note_it = chart.withTimingInfo(chart.buttonNotes());
    let front_button_notes: [Readonly<TimingInfo>, ButtonObject[]]|undefined = front_button_note_it.next().value;
    if(front_button_notes == null) {
        return stat;
    }

    const front_note_time = [0, 0, 0, 0, 0, 0];
    const front_note_jack_count = [0, 0, 0, 0, 0, 0];

    const back_button_note_it = chart.buttonNotes();
    let back_button_notes: [Pulse, ButtonObject[]] = back_button_note_it.next().value;

    const back_note_ends: [Pulse, Pulse, Pulse, Pulse, Pulse, Pulse] = [-1n, -1n, -1n, -1n, -1n, -1n];

    // Notes between [back_button_note, front_button_note], inclusive
    let curr_notes_inbetween = 0;
    while(front_button_notes) {
        const timing_info: Readonly<TimingInfo> = front_button_notes[0];
        for(const button of front_button_notes[1]) {
            ++curr_notes_inbetween;

            if(front_note_jack_count[button.lane] === 0) {
                front_note_jack_count[button.lane] = 1;
            } else if(front_note_time[button.lane] + MAX_JACK_INTERVAL <= timing_info.time) {
                front_note_jack_count[button.lane] = 1;
            } else {
                const jack_count = ++front_note_jack_count[button.lane];
                if(jack_count === 3) {
                    stat.jacks += 3;
                    stat.by_lane[button.lane].jacks += 3;
                } else if(jack_count > 3) {
                    ++stat.jacks;
                    ++stat.by_lane[button.lane].jacks;
                }
            }

            front_note_time[button.lane] = timing_info.time;

            ++stat.notes;
            ++stat.by_lane[button.lane].notes;

            if(button.length > 0n) {
                ++stat.holds;
                ++stat.by_lane[button.lane].holds;

                const chains = chart.getChains([timing_info.pulse, timing_info.pulse + button.length]);

                stat.hold_chains += chains;
                stat.note_chains += chains;
                
                stat.by_lane[button.lane].hold_chains += chains;
                stat.by_lane[button.lane].note_chains += chains;
            } else {
                ++stat.chips;
                ++stat.note_chains;

                ++stat.by_lane[button.lane].chips;
                ++stat.by_lane[button.lane].note_chains;
            }
        }

        // Discard old long notes
        for(let i=0; i<6; ++i) {
            if(back_note_ends[i] < 0n) continue;

            if(back_note_ends[i] + DENSITY_WINDOW <= timing_info.pulse) {
                back_note_ends[i] = -1n;
                --curr_notes_inbetween;
            }
        }

        while(back_button_notes[0] + DENSITY_WINDOW < timing_info.pulse) {
            for(const button of back_button_notes[1]) {
                // Find long notes which must not be discarded (yet).
                if(button.length > 0) {
                    const note_end = back_button_notes[0] + button.length;
                    // Note that > should be used instead of >=; long notes with coinciding with the beginning of a range will not be counted.
                    if(note_end + DENSITY_WINDOW > timing_info.pulse) {
                        back_note_ends[button.lane] = note_end;
                        continue;
                    }
                }

                --curr_notes_inbetween;
            }
            back_button_notes = back_button_note_it.next().value;
        }

        if(curr_notes_inbetween > stat.max_density) {
            stat.max_density = curr_notes_inbetween;
            stat.max_density_range = [back_button_notes[0], timing_info.pulse];
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

enum OneHandState {
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

export function getBeatStat(chart: Chart): BeatStat {
    const stat: BeatStat = {
        bpm_changes: 0,
        bpm_change_intensity: 0,
    };

    const prev_bpm_pair = chart.beat.bpm.nextLowerPair(chart.getFirstNotePulse());
    let prev_bpm = 0;
    if(prev_bpm_pair) {
        prev_bpm = prev_bpm_pair[1][0];
    }
    
    for(const [pulse, bpm] of chart.beat.bpm.iterateRange(chart.getFirstNotePulse(), chart.getLastNotePulse() + 1n)) {
        if(pulse > 0 && prev_bpm > 0) {
            stat.bpm_change_intensity += Math.abs(bpm - prev_bpm);
            ++stat.bpm_changes;
        }

        prev_bpm = bpm;
    }

    return stat;
}

export function getStat(chart: Chart): Stat {
    const stat: Stat = {
        ...getNoteOnlyStat(chart),
        ...getLaserStat(chart),
        ...getBeatStat(chart),
    }

    return stat;
}