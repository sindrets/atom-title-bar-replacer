"use strict";

jest.mock("atom");
jest.mock("electron");

global.atom = require("atom");
const { MenuUpdater, ApplicationMenu } = require("../lib/title-bar-replacer");

jasmine.getEnv().addReporter({
    specStarted: function (result) {
        global.jasmine.currentSpec = result;
    },
});

const SHOW_MOD_COUNT = process.env.TEST_SHOW_MOD_COUNT === "1";
const testTemplate = [
    {
        label: "File",
        submenu: [
            { label: "foo", command: "1" },
            { label: "bar", command: "2" },
            { label: "baz", command: "3" },
            { label: "qux", command: "4" },
        ],
    },
    {
        label: "Edit",
        submenu: [
            { label: "quux", command: "1" },
            { label: "quz", command: "2" },
            { label: "corge", command: "3" },
            { label: "grault", command: "4" },
        ],
    },
    {
        label: "View",
        submenu: [
            { label: "garply", command: "1" },
            { label: "waldo", command: "2" },
            { label: "fred", command: "3" },
            { label: "plugh", command: "4" },
        ],
    },
    {
        label: "Selection",
        submenu: [
            { label: "wibble", command: "1" },
            { label: "wabble", command: "2" },
            { label: "wubble", command: "3" },
            { label: "flob", command: "4" },
        ],
    },
];

function prettyString(object) {
    return JSON.stringify(object, undefined, 2);
}

describe("Insertion", () => {
    let appMenu, edits;

    beforeEach(() => {
        edits = undefined;
        atom.menu.template = JSON.parse(JSON.stringify(testTemplate));
        appMenu = ApplicationMenu.createApplicationMenu(testTemplate);
    });

    afterEach(() => {
        if (SHOW_MOD_COUNT) {
            console.log("edits:", edits);
        }
    });

    describe("Inserting labels", () => {
        it("should insert single label at beginning of menu", () => {
            atom.menu.template.splice(0, 0, {
                label: "lorem",
                submenu: [{ label: "ipsum", command: "dolor" }],
            });
            edits = MenuUpdater.run(appMenu);
            expect(prettyString(appMenu.serialize())).toMatchSnapshot();
        });

        it("should insert multiple labels at beginning of menu", () => {
            atom.menu.template.splice(
                0,
                0,
                {
                    label: "lorem",
                    submenu: [{ label: "ipsum", command: "dolor" }],
                },
                {
                    label: "sit",
                    submenu: [{ label: "amet", command: "consectetur" }],
                },
                {
                    label: "adipiscing",
                    submenu: [{ label: "elit", command: "vestibulum" }],
                }
            );
            edits = MenuUpdater.run(appMenu);
            expect(prettyString(appMenu.serialize())).toMatchSnapshot();
        });

        it("should insert single label at end of menu", () => {
            atom.menu.template.push({
                label: "lorem",
                submenu: [{ label: "ipsum", command: "dolor" }],
            });
            edits = MenuUpdater.run(appMenu);
            expect(prettyString(appMenu.serialize())).toMatchSnapshot();
        });

        it("should insert multiple labels at end of menu", () => {
            atom.menu.template.push(
                {
                    label: "lorem",
                    submenu: [{ label: "ipsum", command: "dolor" }],
                },
                {
                    label: "sit",
                    submenu: [{ label: "amet", command: "consectetur" }],
                },
                {
                    label: "adipiscing",
                    submenu: [{ label: "elit", command: "vestibulum" }],
                }
            );
            edits = MenuUpdater.run(appMenu);
            expect(prettyString(appMenu.serialize())).toMatchSnapshot();
        });

        it("should insert single label in the middle of menu", () => {
            atom.menu.template.splice(2, 0, {
                label: "lorem",
                submenu: [{ label: "ipsum", command: "dolor" }],
            });
            edits = MenuUpdater.run(appMenu);
            expect(prettyString(appMenu.serialize())).toMatchSnapshot();
        });

        it("should insert multiple labels in the middle of menu", () => {
            atom.menu.template.splice(
                2,
                0,
                {
                    label: "lorem",
                    submenu: [{ label: "ipsum", command: "dolor" }],
                },
                {
                    label: "sit",
                    submenu: [{ label: "amet", command: "consectetur" }],
                },
                {
                    label: "adipiscing",
                    submenu: [{ label: "elit", command: "vestibulum" }],
                }
            );
            edits = MenuUpdater.run(appMenu);
            expect(prettyString(appMenu.serialize())).toMatchSnapshot();
        });
    });

    describe("Inserting items", () => {
        it("should do nothing when nothing is changed", () => {
            edits = MenuUpdater.run(appMenu);
            expect(prettyString(appMenu.serialize())).toMatchSnapshot();
        });

        it("should insert single item at beginning of submenu", () => {
            atom.menu.template[2].submenu.splice(0, 0, {
                label: "lorem",
                command: "ipsum",
            });
            edits = MenuUpdater.run(appMenu);
            expect(prettyString(appMenu.serialize())).toMatchSnapshot();
        });

        it("should insert multiple items at beginning of submenu", () => {
            atom.menu.template[2].submenu.splice(
                0,
                0,
                { label: "lorem", command: "ipsum" },
                { label: "dolor", command: "sit" },
                { label: "amet", command: "consectetur" }
            );
            edits = MenuUpdater.run(appMenu);
            expect(prettyString(appMenu.serialize())).toMatchSnapshot();
        });

        it("should insert single item at end of submenu", () => {
            atom.menu.template[2].submenu.push({
                label: "lorem",
                command: "ipsum",
            });
            edits = MenuUpdater.run(appMenu);
            expect(prettyString(appMenu.serialize())).toMatchSnapshot();
        });

        it("should insert multiple items at end of submenu", () => {
            atom.menu.template[2].submenu.push(
                { label: "lorem", command: "ipsum" },
                { label: "dolor", command: "sit" },
                { label: "amet", command: "consectetur" }
            );
            edits = MenuUpdater.run(appMenu);
            expect(prettyString(appMenu.serialize())).toMatchSnapshot();
        });

        it("should insert single item in the middle of submenu", () => {
            atom.menu.template[2].submenu.splice(2, 0, {
                label: "lorem",
                command: "ipsum",
            });
            edits = MenuUpdater.run(appMenu);
            expect(prettyString(appMenu.serialize())).toMatchSnapshot();
        });

        it("should insert multiple items in the middle of submenu", () => {
            atom.menu.template[2].submenu.splice(
                2,
                0,
                { label: "lorem", command: "ipsum" },
                { label: "dolor", command: "sit" },
                { label: "amet", command: "consectetur" }
            );
            edits = MenuUpdater.run(appMenu);
            expect(prettyString(appMenu.serialize())).toMatchSnapshot();
        });

        it("should handle insertions in different parts of the same submenu", () => {
            atom.menu.template[2].submenu.splice(1, 0, {
                label: "lorem",
                command: "ipsum",
            });
            atom.menu.template[2].submenu.splice(3, 0, {
                label: "dolor",
                command: "sit",
            });
            edits = MenuUpdater.run(appMenu);
            expect(prettyString(appMenu.serialize())).toMatchSnapshot();
        });
    });
});

describe("Deletion", () => {
    let appMenu, edits;

    beforeEach(() => {
        edits = undefined;
        atom.menu.template = JSON.parse(JSON.stringify(testTemplate));
        appMenu = ApplicationMenu.createApplicationMenu(testTemplate);
    });

    afterEach(() => {
        if (SHOW_MOD_COUNT) {
            console.log("edits:", edits);
        }
    });

    describe("Deleting labels", () => {
        it("should delete single label at beginning of menu", () => {
            atom.menu.template.splice(0, 1);
            edits = MenuUpdater.run(appMenu);
            expect(prettyString(appMenu.serialize())).toMatchSnapshot();
        });

        it("should delete multiple labels at beginning of menu", () => {
            atom.menu.template.splice(0, 2);
            edits = MenuUpdater.run(appMenu);
            expect(prettyString(appMenu.serialize())).toMatchSnapshot();
        });

        it("should delete single label at end of menu", () => {
            atom.menu.template.splice(atom.menu.template.length - 1, 1);
            edits = MenuUpdater.run(appMenu);
            expect(prettyString(appMenu.serialize())).toMatchSnapshot();
        });

        it("should delete multiple labels at end of menu", () => {
            atom.menu.template.splice(atom.menu.template.length - 2, 2);
            edits = MenuUpdater.run(appMenu);
            expect(prettyString(appMenu.serialize())).toMatchSnapshot();
        });

        it("should delete single label from the middle of the menu", () => {
            atom.menu.template.splice(1, 1);
            edits = MenuUpdater.run(appMenu);
            expect(prettyString(appMenu.serialize())).toMatchSnapshot();
        });

        it("should delete multiple labels from the middle of the menu", () => {
            atom.menu.template.splice(1, 2);
            edits = MenuUpdater.run(appMenu);
            expect(prettyString(appMenu.serialize())).toMatchSnapshot();
        });
    });

    describe("Deleting items", () => {
        it("should delete single item at beginning of submenu", () => {
            atom.menu.template[2].submenu.splice(0, 1);
            edits = MenuUpdater.run(appMenu);
            expect(prettyString(appMenu.serialize())).toMatchSnapshot();
        });

        it("should delete multiple items at beginning of submenu", () => {
            atom.menu.template[2].submenu.splice(0, 2);
            edits = MenuUpdater.run(appMenu);
            expect(prettyString(appMenu.serialize())).toMatchSnapshot();
        });

        it("should delete single item at end of submenu", () => {
            const submenu = atom.menu.template[2].submenu;
            submenu.splice(submenu.length - 1, 1);
            edits = MenuUpdater.run(appMenu);
            expect(prettyString(appMenu.serialize())).toMatchSnapshot();
        });

        it("should delete multiple items at end of submenu", () => {
            const submenu = atom.menu.template[2].submenu;
            submenu.splice(submenu.length - 2, 2);
            edits = MenuUpdater.run(appMenu);
            expect(prettyString(appMenu.serialize())).toMatchSnapshot();
        });

        it("should delete single item from the middle of the submenu", () => {
            atom.menu.template[2].submenu.splice(1, 1);
            edits = MenuUpdater.run(appMenu);
            expect(prettyString(appMenu.serialize())).toMatchSnapshot();
        });

        it("should delete multiple items from the middle of the submenu", () => {
            atom.menu.template[2].submenu.splice(1, 2);
            edits = MenuUpdater.run(appMenu);
            expect(prettyString(appMenu.serialize())).toMatchSnapshot();
        });

        it("should handle deletions in different parts of the same submenu", () => {
            atom.menu.template[2].submenu.splice(1, 1);
            atom.menu.template[2].submenu.splice(2, 1);
            edits = MenuUpdater.run(appMenu);
            expect(prettyString(appMenu.serialize())).toMatchSnapshot();
        });
    });
});
