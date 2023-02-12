import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {ArgumentParser} from 'argparse';

import * as kshoot from "./index.js";

const parser = new ArgumentParser({
    prog: "kshoot",
    description: "KSH/KSON chart utility",
});
parser.add_argument("filename", {help: "file name for the chart"});

const args = parser.parse_args();

let chart_buffer: Buffer;
try {
    chart_buffer = await fs.readFile(path.join(process.cwd(), args.filename));
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
        console.log(`- max. density: ${stat.max_density}`);
        console.log(`- moving lasers: ${stat.moving_lasers}`);
        console.log(`- slams: ${stat.slams}`);
    }

    printRadar(): void {
        const radar: kshoot.tools.stat.Radar = kshoot.tools.stat.getRadar(chart);

        console.log('Chart radar:');
        console.log(`- notes: ${radar.notes}`);
        console.log(`- peak: ${radar.peak}`);
        console.log(`- tsumami: ${radar.tsumami}`);
        console.log(`- tricky: ${radar.tricky}`);
        console.log(`- hand trip: ${radar.hand_trip}`);
        console.log(`- one hand: ${radar.one_hand}`);
    }

    printAnalysis(): void {
        this.printStat();
        this.printRadar();
    }
}

const app: App = new App(args.filename, chart);

app.printSummary();
app.printAnalysis();

