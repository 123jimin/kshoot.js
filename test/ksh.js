import {assert} from 'chai';

import {ksh} from "../dist/index.js";

describe('ksh.Reader', function() {
    describe('.parseLine', function() {
        it("should be able to parse bar lines correctly", function() {
            assert.include(ksh.Reader.parseLine("--"), {type: 'bar'});
            assert.include(ksh.Reader.parseLine("--\r"), {type: 'bar'}, "carriage return must be ignored");
        });

        it("should be able to parse comment lines correctly", function() {
            assert.include(ksh.Reader.parseLine("//This is a comment."), {
                type: 'comment', value: "This is a comment."
            });

            assert.include(ksh.Reader.parseLine("\uFEFF//This is a comment.\r"), {
                type: 'comment', value: "This is a comment."
            }, "BOM character and carriage return must be stripped");

            assert.include(ksh.Reader.parseLine("// \tThis is a comment.\t "), {
                type: 'comment', value: " \tThis is a comment.\t "
            }, "blank characters must be preserved");
            
            assert.include(ksh.Reader.parseLine("//title=hello"), {
                type: 'comment', value: "title=hello"
            }, "comment lines can't be option lines");
            
            assert.include(ksh.Reader.parseLine("//--"), {
                type: 'comment', value: "--"
            }, "comment lines can't be bar lines");
        });

        it("should be able to parse various option lines correctly", function() {
            assert.include(ksh.Reader.parseLine("a=b"), {
                type: 'option', name: "a", value: "b",
            });
            
            assert.include(ksh.Reader.parseLine("\uFEFFa=b\r"), {
                type: 'option', name: "a", value: "b"
            }, "BOM character and carriage return must be stripped");
            
            assert.include(ksh.Reader.parseLine("="), {
                type: 'option', name: "", value: ""
            }, "handling empty name and value");

            assert.include(ksh.Reader.parseLine(" \ta =\tb "), {
                type: 'option', name: " \ta ", value: "\tb "
            }, "blank characters must be preserved");

            assert.include(ksh.Reader.parseLine("title=1+1=2"), {
                type: 'option', name: "title", value: "1+1=2"
            }, "only the first equal sign must be used for splitting name and value");

            assert.include(ksh.Reader.parseLine("\"Hello=World!\"=End"), {
                type: 'option', name: "\"Hello", value: "World!\"=End"
            }, "quotes don't have a special meaning");
            
            assert.include(ksh.Reader.parseLine("good=morning //!!"), {
                type: 'option', name: "good", value: "morning //!!"
            }, "trailing comments should not be supported");
        });

        it("should be able to parse chart lines correctly", function() {
            assert.deepStrictEqual(ksh.Reader.parseLine("0000|00|--"), {
                type: 'chart',
            }, "parsing empty line");

            assert.deepStrictEqual(ksh.Reader.parseLine("1201|00|--"), {
                type: 'chart', bt: [ksh.NoteKind.Short, ksh.NoteKind.Long, ksh.NoteKind.Empty, ksh.NoteKind.Short],
            }, "parsing simple line (BT only)");
            
            assert.deepStrictEqual(ksh.Reader.parseLine("0000|10|0o"), {
                type: 'chart', fx: [ksh.NoteKind.Long, ksh.NoteKind.Empty], laser: [0, 50],
            }, "parsing simple line (FX only)");
            
            assert.deepStrictEqual(ksh.Reader.parseLine("0000|00|-:"), {
                type: 'chart', laser: [null, ':'],
            }, "parsing simple line (laser only, special)");
            
            assert.deepStrictEqual(ksh.Reader.parseLine("0000|00|AU"), {
                type: 'chart', laser: [10, 30],
            }, "parsing simple line (laser only, pos)");
            
            assert.deepStrictEqual(ksh.Reader.parseLine("0120|21|0o"), {
                type: 'chart',
                bt: [ksh.NoteKind.Empty, ksh.NoteKind.Short, ksh.NoteKind.Long, ksh.NoteKind.Empty],
                fx: [ksh.NoteKind.Short, ksh.NoteKind.Long],
                laser: [0, 50],
            }, "parsing simple line");
            
            assert.deepStrictEqual(ksh.Reader.parseLine("0000|FI|--"), {
                type: 'chart',
                fx: [ksh.NoteKind.Long, ksh.NoteKind.Long],
                legacy_fx: ["Flanger", "Gate;16"],
            }, "parsing legacy FXs (Flanger and Gate16)");

            assert.deepStrictEqual(ksh.Reader.parseLine("0000|A1|--"), {
                type: 'chart',
                fx: [ksh.NoteKind.Long, ksh.NoteKind.Long],
                legacy_fx: ["TapeStop", null],
            }, "parsing legacy FXs (Stop)");
            
            for(const [test_in, test_out] of [
                ["@(12", {type: 'normal', direction: 'left', length: 12}],
                ["@)34", {type: 'normal', direction: 'right', length: 34}],
                ["@<56", {type: 'half', direction: 'left', length: 56}],
                ["@>78", {type: 'half', direction: 'right', length: 78}],
                ["S<90", {type: 'swing', direction: 'left', length: 90, amplitude: 250, repeat: 3, decay: 'normal'}],
                ["S>192;111", {type: 'swing', direction: 'right', length: 192, amplitude: 111, repeat: 3, decay: 'normal'}],
                ["S<42.6;222;5", {type: 'swing', direction: 'left', length: 42, amplitude: 222, repeat: 5, decay: 'normal'}],
                ["S>321.2;123.4;56.7;1", {type: 'swing', direction: 'right', length: 321, amplitude: 123, repeat: 56, decay: 'slow'}],
                ["S<1;-2;3;0", {type: 'swing', direction: 'left', length: 1, amplitude: 0, repeat: 3, decay: 'off'}],
                ["S>4;5;6;7", {type: 'swing', direction: 'right', length: 4, amplitude: 5, repeat: 6, decay: 'normal'}],
            ]) {
                assert.deepStrictEqual(ksh.Reader.parseLine("0000|00|--" + test_in), {
                    type: 'chart',
                    spin: test_out,
                }, `parsing spin "${test_in}"`);
            }
        });

        it("should be able to parse audio effect definitions correctly", function() {
            assert.deepInclude(ksh.Reader.parseLine("#define_fx LoFl type=Flanger;delay=80samples;depth=60samples"), {
                type: 'define_fx',
                name: "LoFl",
                params: [
                    ['type', 'Flanger'],
                    ['delay', '80samples'],
                    ['depth', '60samples'],
                ],
            }, "parsing the first example by masaka");

            assert.deepInclude(ksh.Reader.parseLine("#define_filter LOFL type=Flanger;delay=80samples-140samples;depth=0samples"), {
                type: 'define_filter',
                name: "LOFL",
                params: [
                    ['type', 'Flanger'],
                    ['delay', '80samples-140samples'],
                    ['depth', '0samples'],
                ],
            }, "parsing the second example by masaka")

        });
    });

    describe('.parse', function() {
        it("should be able to parse simple empty chart", function() {
            const chart = ksh.parse(`\uFEFFtitle=test\n--\n0000|00|--\n--\n`);

            assert.deepEqual(chart.unknown, {header: [], body: []}, "all lines have to be recognizable");
            assert.deepEqual(chart.header, [{type: 'option', name: 'title', value: 'test'}], "the option line has to be read correctly");
            assert.deepEqual(chart.measures, [{
                time_signature: [4, 4],
                pulse: 0n, length: 192n,
                lines: [{}],
            }], "there should be no note");
        });
    });
});

describe('ksh.Writer', function() {
    describe('.serializeLine', function() {
        it("should be able to serialize bar lines correctly", function() {
            assert.strictEqual(ksh.Writer.serializeLine({type: 'bar'}), "--");
        });

        it("should be able to serialize comment lines correctly", function() {
            assert.strictEqual(ksh.Writer.serializeLine({
                type: 'comment', value: "This is a comment."
            }), "//This is a comment.");

            assert.strictEqual(ksh.Writer.serializeLine({
                type: 'comment', value: " \tThis is a comment.\t "
            }), "// \tThis is a comment.\t ", "blank characters must be preserved");
        });
    });
});