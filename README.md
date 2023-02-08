# kshoot.js

This is JavaScript/TypeScript library for manipulating KSH and KSON chart files of K-Shoot Mania. This project supersedes [kson-js](https://github.com/123jimin/kson-js).

## Warning

### Stability

Currently, kshoot.js is not ready to be used; the API is constantly changing.

I'll try my best to keep the code below working.

```ts
import {parse, Chart, kson} from 'kshoot.js';

// `Chart.parseKSON`, `Chart.parseKSH`, `parse`
let chart: Chart = Chart.parseKSON("... (a valid KSON chart, with or without BOM) ...");
chart = Chart.parseKSH("... (a valid KSH chart, with or without BOM) ...");
chart = parse("... (either KSH or KSON chart, with or without BOM) ...");

// Structure of `Chart` follows that of KSON
const meta: kson.MetaInfo = chart.meta;
const beat: kson.BeatInfo = chart.beat;
const note: kson.NoteInfo = chart.note;

// `Chart#note.bt`, `Chart#note.fx`, and `Chart#note.laser` will be iterable
for(const [y, len] of note.bt[0]) {
    /* ... */
}

```

### Performance

This library is focused on having a simple, modular, and intuitive codebase with little dependency.
At least for now, it will be embraced to have extra time/space costs, including suboptimal time complexity.

Those extra costs may impact you depending on your usecases.
For applications such as chart editors, use other data structure libraries with this library for better performance.

## Example

### Counting notes

```js
import fs from 'node:fs';
import {parse} from 'kshoot.js';

function reportChart(chart_filename) {
    const chart_contents = fs.readFileSync(chart_filename, 'utf-8');
    const chart = parse(chart_contents);

    let short_notes = 0;
    let long_notes = 0;

    const count = (notes_arr) => {
        for(const notes of notes_arr) {
            // Note that the backing data structure for `chart.note.bt` and `chart.note.fx` may change in future.
            // The only gaurantee is that they will always remain to be iterable.
            for(const [y, len] of notes) {
                // Note that pulses use `bigint`, not `number`.
                if(len > 0n) ++long_notes;
                else ++short_notes;
            }
        }
    };

    count(chart.note.bt);
    count(chart.note.fx);

    console.log(`${chart_filename}: ${short_notes} short notes, ${long_notes} long notes`);
}

["./foo.ksh", "./bar.kson"].forEach(reportChart);
```

## Chart file specs

- [KSH Chart File Format Specification](https://github.com/m4saka/ksm-chart-format-spec/blob/master/ksh_format.md)
- [KSON Format Specification](https://github.com/m4saka/ksm-chart-format-spec/blob/master/kson_format.md)

## Dependencies

```text
$ npm ls --prod --all
kshoot@0.0.1
`-- zod@3.20.2
```
