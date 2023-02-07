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
            assert.deepInclude(ksh.Reader.parseLine("0000|00|--"), {
                type: 'chart',
                bt: [ksh.NoteKind.Empty, ksh.NoteKind.Empty, ksh.NoteKind.Empty, ksh.NoteKind.Empty],
                fx: [ksh.NoteKind.Empty, ksh.NoteKind.Empty],
                laser: [null, null],
            }, "parsing empty line");

            assert.deepInclude(ksh.Reader.parseLine("0120|21|0o"), {
                type: 'chart',
                bt: [ksh.NoteKind.Empty, ksh.NoteKind.Short, ksh.NoteKind.Long, ksh.NoteKind.Empty],
                fx: [ksh.NoteKind.Short, ksh.NoteKind.Long],
                laser: [0, 1],
            }, "parsing simple line");
            
            assert.deepInclude(ksh.Reader.parseLine("0000|FI|--"), {
                type: 'chart',
                bt: [ksh.NoteKind.Empty, ksh.NoteKind.Empty, ksh.NoteKind.Empty, ksh.NoteKind.Empty],
                fx: [ksh.NoteKind.Long, ksh.NoteKind.Long],
                laser: [null, null],
                legacy_fx: ["Flanger", "Gate;16"],
            }, "parsing legacy FXs (Flanger and Gate16)");
            
            for(const [test_in, test_out] of [
                ["@(12", {type: 'normal', direction: 'left', length: 12}],
                ["@)34", {type: 'normal', direction: 'right', length: 34}],
                ["@<56", {type: 'half', direction: 'left', length: 56}],
                ["@>78", {type: 'half', direction: 'right', length: 78}],
                ["S<90", {type: 'swing', direction: 'left', length: 90}],
                ["S>192", {type: 'swing', direction: 'right', length: 192}],
            ]) {
                assert.deepInclude(ksh.Reader.parseLine("0000|00|--" + test_in), {
                    type: 'chart',
                    bt: [ksh.NoteKind.Empty, ksh.NoteKind.Empty, ksh.NoteKind.Empty, ksh.NoteKind.Empty],
                    fx: [ksh.NoteKind.Empty, ksh.NoteKind.Empty],
                    laser: [null, null],
                    spin: test_out,
                }, "parsing spins");
            }

            assert.deepInclude(ksh.Reader.parseLine("0000|A1|--"), {
                type: 'chart',
                bt: [ksh.NoteKind.Empty, ksh.NoteKind.Empty, ksh.NoteKind.Empty, ksh.NoteKind.Empty],
                fx: [ksh.NoteKind.Long, ksh.NoteKind.Long],
                laser: [null, null],
                legacy_fx: ["TapeStop", null],
            }, "parsing legacy FXs (Stop)");
        });

        it("should be able to parse audio effect definitions correctly", function() {
            assert.deepInclude(ksh.Reader.parseLine("#define_fx LoFl type=Flanger;delay=80samples;depth=60samples"), {
                type: 'define_fx',
                name: "LoFl",
                params: [
                    ['type', 'Flanger'],
                    ['delay', '80samples'],
                    ['depth', '60samples'],
                ]
            }, "parsing first example by masaka");
        });
    });

    describe('.parse', function() {
        it("should be able to parse simple chart", function() {
            const chart = ksh.parse(`\uFEFFtitle=test\n--\n0000|00|--\n--\n`);
        });
    });
});