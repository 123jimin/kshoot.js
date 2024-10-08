# kshoot.js

![npm](https://img.shields.io/npm/v/kshoot?style=flat-square)
![GitHub Workflow Status (with branch)](https://img.shields.io/github/actions/workflow/status/123jimin/kshoot.js/build.yml?branch=main&style=flat-square)

This is JavaScript/TypeScript library for manipulating KSH and KSON chart files of K-Shoot Mania.
This library is focused on having a simple, modular, and intuitive codebase with little dependency.

**NOTE:** Check out [kshoot-tools](https://github.com/123jimin/kshoot-tools) if you are looking for *a program or a tool* to do something with chart files.
This library can be used to create such tools, but is not a tool by itself.

## Progress

This library is currently work-in-progress with only the basic features implemented.

- KSH/KSON I/O
  - [x] Reading KSH
  - [x] Reading KSON
  - [ ] Writing KSH
  - [ ] Writing KSON
  - [x] Metadata
  - [x] Comments
  - [x] Notes and lasers
  - [ ] Audio effects
  - [X] Camera effects
  - [ ] BG effects
- Simple API
  - [x] Iterating each note in the chart
  - [x] Calculating median BPM

## Chart file specs

- [KSH Chart File Format Specification](https://github.com/m4saka/ksm-chart-format-spec/blob/master/ksh_format.md)
- [KSON Format Specification](https://github.com/m4saka/ksm-chart-format-spec/blob/master/kson_format.md)

## Examples

### Basic data structure

`Chart` implements `kson.Kson`, so be sure to read the KSON spec before using this library. Also, `ByPulse<...>[]` and similar lists are managed by [sorted-btree](https://github.com/qwertie/btree-typescript).

```ts
import {parse, Chart, kson} from 'kshoot.js';

// `Chart.parseKSON`, `Chart.parseKSH`, `parse` for parsing a chart
// Note that strings without BOMs are preferred.
let chart: Chart = Chart.parseKSON("... (a valid KSON chart, with or without BOM) ...");
chart = Chart.parseKSH("... (a valid KSH chart, with or without BOM) ...");
chart = parse("... (either KSH or KSON chart, with or without BOM) ...");

// Structure of `Chart` follows that of KSON
const meta: kson.MetaInfo = chart.meta;
const beat: kson.BeatInfo = chart.beat;
const note: kson.NoteInfo = chart.note;

// Some lists such as note.bt/fx/laser and beat.bpm are not arrays,
// but they are nevertheless iterable.
for(const [y, len] of note.bt[0]) {
    /* ... */
}

```

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

## Dependencies

I want `kshoot` to have as little dependencies as possible. Some zero-dependency libraries are too cool to not use, though.

```text
$ pnpm ls --prod --depth 2
Legend: production dependency, optional only, dev only

kshoot@0.2.1 D:\Project\GitHub\kshoot.js

dependencies:
sorted-btree 1.8.1
zod 3.23.8
```
