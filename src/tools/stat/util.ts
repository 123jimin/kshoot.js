import { NoteLane, type LaserLane } from "../../chart/index.js";

export const isOnSide = (note_lane: NoteLane, laser_lane: LaserLane): boolean => {
    switch(note_lane) {
        case NoteLane.BT_A: return laser_lane === 0;
        case NoteLane.BT_B: return laser_lane === 0;
        case NoteLane.BT_C: return laser_lane === 1;
        case NoteLane.BT_D: return laser_lane === 1;
        case NoteLane.FX_L: return laser_lane === 0;
        case NoteLane.FX_R: return laser_lane === 1;
    }
}