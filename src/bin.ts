// This is a simple app for testing features of this library.
// Use `kshoot-tools` instead for more diverse tasks.

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as kshoot from "./index.js";

const chart_filename = process.argv.at(-1);
if(!chart_filename) process.exit(1);

let chart_buffer: Buffer;
try {
    const chart_path = path.isAbsolute(chart_filename) ? chart_filename : path.join(process.cwd(), chart_filename);
    chart_buffer = await fs.readFile(chart_path);
} catch(e: unknown) {
    console.error(`${e}`);
    process.exit(1);
}

const chart_str = chart_buffer.toString('utf-8');
const chart: kshoot.Chart = kshoot.parse(chart_str);

class App {
    filename: string;
    chart: kshoot.Chart;
    constructor(filename: string, chart: kshoot.Chart) {
        this.filename = filename;
        this.chart = chart;
    }

    printSummary(): void {
        console.log(`Chart read from ${this.filename}:`);        
        console.log(`- title: ${this.chart.meta.title}`);
        console.log(`- level: ${this.chart.difficulty_id} ${this.chart.meta.level}`);
        console.log(`- bpm (displayed): ${this.chart.meta.disp_bpm}`);
        console.log(`- artist: ${this.chart.meta.artist}`);
        console.log(`- effector: ${this.chart.meta.chart_author}`);

        if(this.chart.compat) {
            console.log(`- KSH version: ${this.chart.compat.ksh_version}`);
        }
    }

    printStat(): void {
        const stat: kshoot.tools.stat.Stat = kshoot.tools.stat.getStat(chart);

        console.log('Chart stats:');
        console.log(`- notes: ${stat.notes} (${stat.chips} chips + ${stat.holds} holds)`);
        console.log(`- max density: ${stat.max_density}`);
        console.log(`- lasers: ${stat.moving_lasers + stat.slams} (${stat.moving_lasers} moving lasers + ${stat.slams} slams)`);
        console.log(`- one hand: ${stat.one_hand_notes}`);
        console.log(`- hand trip: ${stat.wrong_side_notes}`);
        console.log(`- jacks: ${stat.jacks} (BC: ${[1, 2].map((lane) => stat.by_lane[lane].jacks).reduce((x, y) => x+y)}, ADLR: ${[0, 3, 4,].map((lane) => stat.by_lane[lane].jacks).reduce((x, y) => x+y)})`);
    }

    printAnalysis(): void {
        this.printStat();
    }
}

const app: App = new App(chart_filename, chart);

app.printSummary();
app.printAnalysis();

