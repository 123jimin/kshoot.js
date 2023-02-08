import {z} from 'zod';

import * as ksh from "./ksh/index.js";
import * as kson from "./kson/index.js";

function addByPulseArr<T>(arr: kson.ByPulse<T>[], [pulse, obj]: kson.ByPulse<T>, unique = false) {
    if(unique && arr.length > 0 && arr[arr.length-1][0] === pulse) {
        arr[arr.length-1][1] = obj;
    } else {
        arr.push([pulse, obj]);
    }
}

const schema = Object.freeze({
    difficulty: z.union([z.enum(['light', 'challenge', 'extended', 'infinite']).transform((v) => ksh.difficultyToInt(v)), z.string()]),
    level: z.coerce.number().int().min(1).max(20).catch(1),
    bpm: z.coerce.number().finite().positive(),
} as const);

export class Converter implements kson.Chart {
    version: string = kson.VERSION;
    meta: kson.MetaInfo = kson.schema.MetaInfo.parse({});
    beat: kson.BeatInfo = kson.schema.BeatInfo.parse({});
    gauge: kson.GaugeInfo = kson.schema.GaugeInfo.parse({});
    note: kson.NoteInfo = kson.schema.NoteInfo.parse({});
    editor: kson.EditorInfo = kson.schema.EditorInfo.parse({});
    compat: kson.CompatInfo = kson.schema.CompatInfo.parse({});

    private constructor() { /* empty */ }

    static convert(ksh_chart: ksh.Chart): Readonly<kson.Chart> {
        const converter = new Converter();
        converter._convert(ksh_chart);
        return converter;
    }
    
    private _convert(ksh_chart: ksh.Chart) {
        this._read_header(ksh_chart.header);
    }

    private _read_header(options: ksh.OptionLine[]) {
        const meta = this.meta;
        for(const {name, value} of options) {
            switch(name) {
                case 'title':  meta.title = value; break;
                case 'title_img': meta.title_img_filename = value; break;
                case 'artist': meta.artist = value; break;
                case 'artist_img': meta.artist_img_filename = value; break;
                case 'effect': meta.chart_author = value; break;
                case 'jacket': meta.jacket_filename = value; break;
                case 'illustrator': meta.jacket_author = value; break;
                case 'difficulty': meta.difficulty = schema.difficulty.parse(value); break;
                case 'level': meta.level = schema.level.parse(value); break;
                case 't':
                    try {
                        const bpm = schema.bpm.parse(value);
                        addByPulseArr(this.beat.bpm, [0n, bpm], true);
                    } catch(_) { /* empty */ }
                    meta.disp_bpm = value;
                    break;
                case 'to':
                    if(value.trim() !== '0') try {
                        const bpm = schema.bpm.parse(value);
                        meta.std_bpm = bpm;
                    } catch(_) { /* empty */ }
                    break;
                case 'beat':
                case 'm':
                case 'mvol':
                case 'o':
                case 'bg':
                case 'layer':
                case 'po':
                case 'plength':
                case 'total':
                case 'chokkakuvol':
                case 'chokkakuautovol':
                case 'filtertype':
                case 'pfiltergain':
                case 'pfilterdelay':
                case 'v':
                case 'vo':
                    break;
                case 'ver': this.compat.ksh_version = value; break;
                case 'information': meta.information = value; break;
                default:
                    // TODO: add compat info
            }
        }
    }
}

export default function convert(ksh_chart: ksh.Chart): kson.Kson {
    return Converter.convert(ksh_chart);
}