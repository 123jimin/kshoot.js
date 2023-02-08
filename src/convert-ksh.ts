import {z} from 'zod';

import * as ksh from "./ksh/index.js";
import * as kson from "./kson/index.js";
import {Chart} from "./chart.js";

type ConvertedChart = Chart & { compat: kson.CompatInfo };

const schema = Object.freeze({
    difficulty: z.union([z.enum(['light', 'challenge', 'extended', 'infinite']).transform((v) => ksh.difficultyToInt(v)), z.string()]),
    level: z.coerce.number().int().min(1).max(20).catch(1),
    bpm: z.coerce.number().finite().positive(),
} as const);

class Converter {
    readonly ksh_chart: ksh.Chart;
    chart: ConvertedChart;

    constructor(ksh_chart: ksh.Chart) {
        this.ksh_chart = ksh_chart;
        this.chart = new Chart(kson.schema.Kson.parse({
            compat: kson.schema.CompatInfo.parse({}),
        })) as ConvertedChart;
    
        this._convertHeader();
    }

    private _convertHeader(): void {
        const options = this.ksh_chart.header;
        const meta = this.chart.meta;
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
                        this.chart.setBPM(0n, bpm);
                    } catch(_) { /* empty */ }
                    meta.disp_bpm = value;
                    break;
                case 'to':
                    if(value.trim() !== '0') try {
                        const bpm = schema.bpm.parse(value);
                        meta.std_bpm = bpm;
                    } catch(_) { /* empty */ }
                    break;
                case 'beat': {
                    const [numerator, denominator] = value.split('/').map((v) => parseInt(v));
                    this.chart.setTimeSignature(0n, numerator, denominator);
                    break;
                }
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
                case 'ver': this.chart.compat.ksh_version = value; break;
                case 'information': meta.information = value; break;
                default:
                    // TODO: add compat info
            }
        }
    }
}
export default function convert(ksh_chart: ksh.Chart): ConvertedChart {
    return (new Converter(ksh_chart)).chart;
}