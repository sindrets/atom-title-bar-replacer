"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var asar = require("asar");
var $ = require("jquery");
var jQuery = $;
var childProcess = require("child_process");
var _this, rootPath, modalDiv, modal;
var WindowFrameRemover = /** @class */ (function () {
    function WindowFrameRemover() {
        _this = this;
        rootPath = process.execPath.replace(/\\/g, "/");
        rootPath = rootPath.substr(0, rootPath.lastIndexOf("/") + 1) + "resources/";
    }
    WindowFrameRemover.prototype.run = function () {
        var Operations;
        (function (Operations) {
            Operations[Operations["PATCH"] = 0] = "PATCH";
            Operations[Operations["REVERT"] = 1] = "REVERT";
            Operations[Operations["CANCEL"] = 2] = "CANCEL";
        })(Operations || (Operations = {}));
        var operation = 0;
        if (process.platform == "darwin" || process.platform == "linux") {
            atom.confirm({
                message: "Window Frame Remover Utility",
                detailedMessage: "The Window Frame Remover Utility only works on Windows at the moment.",
                buttons: ['OK']
            });
            return;
        }
        atom.confirm({
            message: "Window Frame Remover Utility",
            detailedMessage: "This utility will edit one line in Atom's source (atom-window.js). The modification will allow "
                + "Atom to start without the native title bar so that the 'Title Bar Replacer' package can serve "
                + "as the only title bar. Press 'Patch' to proceed. \n\nPress 'Revert' to restore default behaviour "
                + "and bring back the native title bar.",
            buttons: {
                'Patch': function () { operation = Operations.PATCH; },
                'Revert': function () { operation = Operations.REVERT; },
                'Cancel': function () { operation = Operations.CANCEL; }
            }
        });
        if (operation == Operations.CANCEL)
            return;
        var exists = {
            "_app-extract": false,
            "app.asar": false,
            "app.asar.bak": false,
            "app-FRAMELESS.asar": false,
            "app.asar.bak.unpacked": false,
            "app.asar.unpacked": false
        };
        exists["_app-extract"] = fs.existsSync(rootPath + "_app-extract");
        exists["app.asar"] = fs.existsSync(rootPath + "app.asar");
        exists["app.asar.bak"] = fs.existsSync(rootPath + "app.asar.bak");
        exists["app-FRAMELESS.asar"] = fs.existsSync(rootPath + "app-FRAMELESS.asar");
        exists["app.asar.bak.unpacked"] = fs.existsSync(rootPath + "app.asar.bak.unpacked");
        exists["app.asar.unpacked"] = fs.existsSync(rootPath + "app.asar.unpacked");
        if (operation == Operations.REVERT) {
            this.removeFrame("revert-init", exists);
            return;
        }
        process.noAsar = true;
        this.removeFrame(0, exists);
    };
    WindowFrameRemover.prototype.buildModal = function () {
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
        var info = document.createElement("span");
        $(info).css("display", "block");
        $(info).css("text-align", "center");
        wrap.appendChild(info);
        wrap.setText = function (string) {
            stat.innerText = string;
        };
        wrap.setInfo = function (string) {
            info.innerText = string;
        };
        return wrap;
    };
    WindowFrameRemover.prototype.styleEndCard = function () {
        //Add restart button
        var button = document.createElement("button");
        button.classList.add("btn", "btn-info");
        button.innerHTML = "Close Atom";
        $(".window-frame-remover")[0].appendChild(button);
        $(".window-frame-remover button").click(function () {
            atom.close();
        });
        //Add 'check' icon
        $(".window-frame-remover div").css("padding", "0px");
        $(modalDiv).find("div span").removeClass();
        $(modalDiv).find("div span").addClass("icon-check");
        var sheet = this.getStyleSheet();
        sheet.insertRule("span.icon-check::before { font-size: 62px; color: #00d185; }", sheet.cssRules.length);
        sheet.insertRule(".window-frame-remover button { display: block; margin: auto; margin-top: 20px; font-size: medium; }", sheet.cssRules.length);
        var stat = $(modalDiv).find("span").not(".loading");
        stat.css("margin", "12px");
        stat.css("font-size", "22px");
    };
    /**
     * Synchronously and recursively delete a folder.
     * @param  {string} rootPath Folder rootPath
     */
    WindowFrameRemover.prototype.deleteFolderRecursive = function (rootPath) {
        if (fs.existsSync(rootPath)) {
            fs.readdirSync(rootPath).forEach(function (file) {
                var curPath = rootPath + "/" + file;
                if (fs.statSync(curPath).isDirectory()) {
                    _this.deleteFolderRecursive(curPath);
                }
                else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(rootPath);
        }
    };
    /**
     * Synchronously copy a file to a specified location.
     * @param  {string} source Path to the file to be copied
     * @param  {string} target Path to the target copy location
     */
    WindowFrameRemover.prototype.copyFileSync = function (source, target) {
        var targetFile = target;
        //if target is a directory a new file with the same name will be created
        if (fs.existsSync(target)) {
            if (fs.lstatSync(target).isDirectory()) {
                targetFile = path.join(target, path.basename(source));
            }
        }
        fs.writeFileSync(targetFile, fs.readFileSync(source));
    };
    /**
     * Synchronously and recursively copy a folder to a specified location.
     * @param {string} source Path to the folder to be copied
     * @param {string} target Path to the target copy location
     */
    WindowFrameRemover.prototype.copyFolderRecursiveSync = function (source, target) {
        if (!fs.existsSync(target))
            fs.mkdirSync(target);
        var traverse = function (folder) {
            var files = fs.readdirSync(source + "/" + folder);
            files.forEach(function (file) {
                var curSource = path.join(source + folder, file);
                if (fs.lstatSync(curSource).isDirectory()) {
                    fs.mkdirSync(target + "/" + folder + "/" + file);
                    traverse(folder + "/" + file); // Recurse
                }
                else {
                    _this.copyFileSync(source + "/" + folder + "/" + file, target + "/" + folder + "/" + file);
                }
            });
        };
        traverse("");
    };
    /**
     * Open a file-explorer revealing Atom's resources folder. \n
     * (%localappdata%/atom/app-#.#.#/resources)
     */
    WindowFrameRemover.prototype.openResDir = function () {
        var os = process.platform;
        if (os == "win32")
            childProcess.exec("start \"\" \"" + rootPath + "\""); //Use empty title parameter and quotes around path in case of spaces in folder name
        else
            childProcess.exec("open \"" + rootPath + "\"");
    };
    /**
     * Synchronously and recursively count the number of files and folders in a specified folder.
     * @param  {string} source Path to the folder
     * @return {number}        Total number of files and folders
     */
    WindowFrameRemover.prototype.numFilesSync = function (source) {
        var count = 0;
        if (!fs.existsSync(source))
            return count;
        var traverse = function (folder) {
            var files = fs.readdirSync(source + "/" + folder);
            files.forEach(function (file) {
                count++;
                var curSource = path.join(source + folder, file);
                if (fs.lstatSync(curSource).isDirectory()) {
                    traverse(folder + "/" + file); // Recurse
                }
            });
        };
        traverse("");
        return count;
    };
    /**
     * Asynchronously extract all contents of an ASAR archive to a specified location.
     * @param {string}   source   Path to the ASAR archive
     * @param {string}   target   Path to extraction directory. Folder will be created if the specified
     *                              doesn't exist.
     * @param {Function} callback Callback to be ran when extraction has finished.
     */
    WindowFrameRemover.prototype.extractAsarAsync = function (source, target, callback) {
        var child = childProcess.fork(__dirname + path.sep + "utility-worker.js");
        console.log("Child worker running with PID: " + child.pid);
        child.on("message", function (data) {
            if (data.type == "extract" && data.status == "success") {
                child.send({
                    type: "stop"
                });
                callback();
            }
        });
        child.send({
            type: "extract",
            source: source,
            target: target
        });
    };
    WindowFrameRemover.prototype.removeFrame = function (step, exists) {
        switch (step) {
            case 0:
                modalDiv = this.buildModal();
                modal = atom.workspace.addModalPanel({ item: modalDiv });
                var id = setInterval(function () {
                    if ($(".modal.overlay.from-top").find(".window-frame-remover").length > 0) {
                        clearInterval(id);
                        _this.removeFrame(1, exists);
                    }
                }, 50);
                break;
            case 1:
                if (exists["_app-extract"]) {
                    modalDiv.setText("Deleting previously generated '_app-extract'...");
                    setTimeout(function () {
                        _this.deleteFolderRecursive(rootPath + "_app-extract");
                        _this.removeFrame(2, exists);
                    }, 50);
                }
                else
                    this.removeFrame(2, exists);
                break;
            case 2:
                if (exists["app-FRAMELESS.asar"]) {
                    modalDiv.setText("Deleting previously modified 'app-FRAMELESS.asar'...");
                    setTimeout(function () {
                        fs.unlinkSync(rootPath + "app-FRAMELESS.asar");
                        _this.removeFrame(3, exists);
                    }, 50);
                }
                else
                    this.removeFrame(3, exists);
                break;
            case 3:
                if (exists["app.asar.bak.unpacked"]) {
                    modalDiv.setText("Deleting previously modified 'app.asar.bak.unpacked'...");
                    setTimeout(function () {
                        _this.deleteFolderRecursive(rootPath + "app.asar.bak.unpacked");
                        _this.removeFrame(4, exists);
                    }, 50);
                }
                else
                    this.removeFrame(4, exists);
                break;
            case 4:
                modalDiv.setText("Creating backup of original 'app.asar'...");
                setTimeout(function () {
                    if (!exists["app.asar.bak"])
                        _this.copyFileSync(rootPath + "app.asar", rootPath + "app.asar.bak"); //Copy original app.asar
                    _this.removeFrame(5, exists);
                }, 50);
                break;
            case 5:
                modalDiv.setText("Extracting app.asar (This might take some time. Please remain patient)...");
                setTimeout(function () {
                    if (exists["app.asar.unpacked"])
                        _this.copyFolderRecursiveSync(rootPath + "app.asar.unpacked", rootPath + "app.asar.bak.unpacked");
                    _this.extractAsarAsync(rootPath + "app.asar.bak", rootPath + "_app-extract", function () {
                        _this.removeFrame(6, exists);
                    });
                    // Update info text on extraction progress until complete.
                    var total = asar.listPackage(rootPath + "app.asar.bak").length;
                    var progress;
                    var intervalId = setInterval(function () {
                        progress = _this.numFilesSync(rootPath + "_app-extract");
                        if (progress >= total)
                            clearInterval(intervalId);
                        modalDiv.setInfo("Extracted " + progress + " of " + total + ".");
                    }, 500);
                }, 50);
                break;
            case 6:
                modalDiv.setText("Modifying 'atom-window.js'...");
                setTimeout(function () {
                    var data = fs.readFileSync(rootPath + "_app-extract/src/main-process/atom-window.js", "utf-8");
                    var newData = data.replace("options = {", "options = {\n        frame: false,");
                    fs.writeFile(rootPath + "_app-extract/src/main-process/atom-window.js", newData, "utf-8", _this.removeFrame(7));
                }, 50);
                break;
            case 7:
                modalDiv.setText("Repacking '_app-extract' (This might take some time. Please remain patient)...");
                setTimeout(function () {
                    asar.createPackage(rootPath + "_app-extract", rootPath + "app-FRAMELESS.asar", function () { _this.removeFrame(8); });
                }, 50);
                break;
            case 8:
                modalDiv.setText("Frame removal process completed successfully! Close Atom and rename 'app-FRAMELESS.asar' to 'app.asar'.");
                modalDiv.setInfo("");
                this.styleEndCard();
                setTimeout(function () {
                    process.noAsar = false;
                    _this.removeFrame(9);
                }, 50);
                break;
            case 9:
                atom.confirm({
                    message: "Success!",
                    detailedMessage: "The frame removal process completed successfully! However, 'app.asar' cannot be modified while atom is running. "
                        + "Upon closing this prompt a file-explorer window will open revealing Atom's 'resources' folder. "
                        + "For the changes to take effect, delete the current 'app.asar' and rename the file 'app-FRAMELESS.asar' to 'app.asar'. "
                        + "A backup is created as 'app.asar.bak'",
                    buttons: {
                        'I Understand': function () { _this.openResDir(); }
                    }
                });
                break;
            // Reversion
            case "revert-init":
                if (!exists["app.asar.bak"]) {
                    atom.confirm({
                        message: "Window Frame Remover Utility",
                        detailedMessage: "A backup could not be located. The window frame removal has either not been run on this version of Atom, or the backup has been deleted. Reversion cannot continue.",
                        buttons: ['Close']
                    });
                }
                else {
                    modalDiv = this.buildModal();
                    modal = atom.workspace.addModalPanel({ item: modalDiv });
                    var id = setInterval(function () {
                        if ($(".modal.overlay.from-top").find(".window-frame-remover").length > 0) {
                            clearInterval(id);
                            _this.removeFrame("revert-guide", exists);
                        }
                    }, 50);
                }
                break;
            case "revert-guide":
                modalDiv.setText("Delete 'app.asar', and rename 'app.asar.bak' to 'app.asar'.");
                this.styleEndCard();
                setTimeout(function () {
                    atom.confirm({
                        message: "Window Frame Remover Utility",
                        detailedMessage: "'app.asar' cannot be modified while Atom is running. Upon closing this prompt a file-explorer window will open revealing Atom's 'resources' folder. To restore Atom, close the program, delete 'app.asar', and rename 'app.asar.bak' to 'app.asar'.",
                        buttons: {
                            'I Understand': function () { _this.openResDir(); }
                        }
                    });
                }, 50);
                break;
        }
    };
    WindowFrameRemover.prototype.createStyleSheet = function () {
        var style = document.createElement("style");
        style.id = "title-bar-replacer-style";
        style.appendChild(document.createTextNode(""));
        document.head.appendChild(style);
        return style.sheet;
    };
    WindowFrameRemover.prototype.styleExists = function () {
        return ($("#title-bar-replacer-style")[0] != undefined);
    };
    WindowFrameRemover.prototype.getStyleSheet = function () {
        if (!this.styleExists())
            return this.createStyleSheet();
        return $("#title-bar-replacer-style")[0].sheet;
    };
    return WindowFrameRemover;
}());
exports.default = WindowFrameRemover;
