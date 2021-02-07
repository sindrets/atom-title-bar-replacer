"use strict";

jest.mock("atom");
jest.mock("electron");

global.atom = require("atom");
const { Diff } = require("../lib/title-bar-replacer");

jasmine.getEnv().addReporter({
    specStarted: function(result) {
        global.jasmine.currentSpec = result;
    }
});

describe("Insertion", () => {
    it("should detect multiple insertions in different places", () => {
        const a = "abcdef".split("");
        const b = "abgchdef".split("");
        const diff = new Diff(a, b);
        const editscript = diff.createEditScript();
        expect(editscript).toEqual([0,0,2,0,2,0,0,0]);
    });
});