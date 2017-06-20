'use babel';

var fs = require("fs");
var $ = jQuery = require("jquery");

var path, modalDiv, modal;

export default class WindowFrameRemover {

    constructor() {
        path = process.execPath.replace(/\\/g, "/");
        path = path.substr(0, path.lastIndexOf("/")+1) + "resources/app/src/main-process/";
    }

    run() {
        var operation = 0;

        if (process.platform == "darwin" || process.platform == "linux") {
            atom.confirm({
                message:"Window Frame Remover Utility",
                detailedMessage:"The Window Frame Remover Utility only works on Windows at the moment.",
                buttons: [ 'OK' ]
            });
            return;
        }

        atom.confirm({
            message:"Window Frame Remover Utility",
            detailedMessage:
                "This utility will edit one line in Atom's source (atom-window.js). The modification will allow "
                +"Atom to start without the native title bar so that the 'Title Bar Replacer' package can serve "
                +"as the only title bar. Press 'Yes' to proceed. \n\nPress 'Revert' to restore default behaviour "
                +"and bring back the native title bar.",
            buttons:{
                'Yes': function() { operation = 1 },
                'Revert': function() { operation = 2 },
                'Cancel': function() { operation = 0 }
            }
        });

        if (operation == 0) return;

        var exists = { 0: false };
        exists[0] = fs.existsSync(path+"atom-window.js.bak");
        if (operation == 2) {
            removeFrame(5, exists);
            return;
        }
        removeFrame(0, exists);
    }
}

function buildModal() {
    var wrap = document.createElement("div");
    wrap.classList.add("window-frame-remover");
    $(wrap).css("margin-bottom", "7px");

    var spinWrap = document.createElement("div");
    $(spinWrap).css("display", "table");
    $(spinWrap).css("margin", "auto");
    $(spinWrap).css("padding", "26px");
    wrap.appendChild(spinWrap);

    var spinner = document.createElement("span");
    spinner.classList.add("loading", "loading-spinner-large");
    spinWrap.appendChild(spinner);

    var stat = document.createElement("span");
    stat.innerHTML = "Modifying app...";
    $(stat).css("display", "block");
    $(stat).css("text-align", "center");
    wrap.appendChild(stat);

    wrap.setText = function(string) {
        stat.innerHTML = string;
    }

    return wrap;
}

function styleEndCard() {
    //Add restart button
    var button = document.createElement("button");
    button.classList.add("btn", "btn-info");
    button.innerHTML = "Restart Atom";
    $(".window-frame-remover")[0].appendChild(button);
    $(".window-frame-remover button").click(function() {
        atom.restartApplication();
    });

    //Add 'check' icon
    $(".window-frame-remover div").css("padding", "0px");
    $(modalDiv).find("div span").removeClass();
    $(modalDiv).find("div span").addClass("icon-check");

    sheet = getStyleSheet();
    sheet.insertRule("span.icon-check::before { font-size: 62px; color: #00d185; }");
    sheet.insertRule(".window-frame-remover button { display: block; margin: auto; margin-top: 20px; font-size: medium; }")
    var stat = $(modalDiv).find("span").not(".loading");
    stat.css("margin", "12px");
    stat.css("font-size", "22px");
}

function deleteFolderRecursive(path) {
    if( fs.existsSync(path) ) {
        fs.readdirSync(path).forEach(function(file) {
            var curPath = path + "/" + file;
            if(fs.statSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}

function removeFrame(step, exists) {

    switch (step) {
        case 0:
        modalDiv = buildModal();
        modal = atom.workspace.addModalPanel({item: modalDiv});

        var id = setInterval(function() {
            if ($(".modal.overlay.from-top").find(".window-frame-remover").length > 0) {
                clearInterval(id);
                removeFrame(1, exists);
            }
        }, 50);

        break;

        case 1:
        if (exists[0]) {
            modalDiv.setText("Deleting previously modified 'atom-window.js'...");
            setTimeout(function () {
                fs.unlink(path+"atom-window.js", function() {
                    fs.renameSync(path+"atom-window.js.bak", path+"atom-window.js");
                    removeFrame(2, exists);
                });
            }, 50);
            break;
        }
        else removeFrame(2, exists);
        break;

        case 2:
        modalDiv.setText("Creating backup of original 'atom-window.js'...");
        setTimeout(function () {
            fs.createReadStream(path+"atom-window.js").pipe(fs.createWriteStream(path+"atom-window.js.bak")); //Copy original atom-window.js
            removeFrame(3, exists);
        }, 50);
        break;

        case 3:
        modalDiv.setText("Modifying 'atom-window.js'...")
        setTimeout(function () {
            var data = fs.readFileSync(path+"atom-window.js", "utf-8");
            var newData = data.replace("options = {", "options = {\n        frame: false,");
            fs.writeFile(path+"atom-window.js", newData, "utf-8", removeFrame(4));
        }, 50);
        break;

        case 4:
        modalDiv.setText("Frame removal process completed successfully! Restart Atom for the changes to take effect.");
        styleEndCard();

        break;

        //Reversion
        case 5:
        if (!exists[0]) {
            atom.confirm({
                message:"Window Frame Remover Utility",
                detailedMessage:"A backup could not be located. The window frame removal has either not been run on this version of Atom, or the backup has been deleted. Reversion cannot continue.",
                buttons: [ 'Close' ]
            });
        }
        else {
            modalDiv = buildModal();
            modal = atom.workspace.addModalPanel({item: modalDiv});

            var id = setInterval(function() {
                if ($(".modal.overlay.from-top").find(".window-frame-remover").length > 0) {
                    clearInterval(id);
                    removeFrame(6, exists);
                }
            }, 50);
        }
        break;

        case 6:
        modalDiv.setText("Reverting Atom...");
        //Delete modified file and rename backup
        setTimeout(function () {
            fs.unlink(path+"atom-window.js", function() {
                fs.renameSync(path+"atom-window.js.bak", path+"atom-window.js");
                removeFrame(7, exists);
            });
        }, 50);
        break;

        case 7:
        modalDiv.setText("Reversion has completed successfully! Restart Atom for the changes to take effect.");
        styleEndCard();
        break;
    }
}

function createStyleSheet() {

    var style = document.createElement("style");
    style.id = "title-bar-replacer-style";
    style.appendChild(document.createTextNode(""));
    document.head.appendChild(style);

    return style.sheet;
}

function styleExists() {
    return ($("#title-bar-replacer-style")[0] != undefined);
}

function getStyleSheet() {
    if (!styleExists())
        return createStyleSheet();

    return $("#title-bar-replacer-style")[0].sheet;
}
