"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var menu_updater_1 = require("./menu-updater");
var $ = require("jQuery");
var jQuery = $;
var remote = require('electron').remote;
var shell = require('electron').shell;
var mainWindow;
var customMenu;
var _this;
var TitleBarReplacerView = /** @class */ (function () {
    function TitleBarReplacerView(args) {
        this.firstBuildDone = false;
        this.builtFromState = false;
        _this = this;
        this.TitleBarReplacer = args.titleBarReplacer;
        this.MenuUpdater = new menu_updater_1.default(this);
        // Create root element
        if (args.html) {
            var temp = document.createElement("template");
            temp.innerHTML = args.html;
            this.element = temp.content.firstChild;
            this.builtFromState = true;
            this.firstBuildDone = true;
            if (args.template) {
                this.currentTemplate = JSON.parse(args.template);
            }
        }
        else {
            this.element = document.createElement('div');
            this.element.classList.add('title-bar-replacer');
            var menuDiv = document.createElement('div');
            menuDiv.classList.add('tbr-title-bar');
            var titleSpan = document.createElement("span");
            titleSpan.classList.add("custom-title");
            var titleString = "Atom";
            titleSpan.innerHTML = titleString;
            menuDiv.appendChild(titleSpan);
            var controlWrap = document.createElement("div");
            controlWrap.classList.add("control-wrap");
            menuDiv.appendChild(controlWrap);
            var tbrMinimize = document.createElement("i");
            tbrMinimize.textContent = "control_minimize";
            tbrMinimize.classList.add("tbr-minimize");
            controlWrap.appendChild(tbrMinimize);
            var tbrMaximize = document.createElement("i");
            tbrMaximize.textContent = "control_maximize";
            tbrMaximize.classList.add("tbr-maximize");
            controlWrap.appendChild(tbrMaximize);
            var customClose = document.createElement("i");
            customClose.textContent = "control_close";
            customClose.classList.add("tbr-close");
            controlWrap.appendChild(customClose);
            this.element.appendChild(menuDiv);
            customMenu = document.createElement("div");
            customMenu.classList.add("app-menu");
            this.element.appendChild(customMenu);
        }
        this.initTitleListener(this.element.querySelector(".custom-title"));
        this.element.isVisible = function () {
            return ($(".title-bar-replacer").css("display") != "none");
        };
        this.element.isMenuVisible = function () {
            return (!$(".app-menu").hasClass("no-menu-bar"));
        };
    }
    TitleBarReplacerView.prototype.spawnTemp = function () {
        this.spawnTempLabels(customMenu);
    };
    TitleBarReplacerView.prototype.cleanOpenClass = function (jqueryElmnt) {
        if (!jqueryElmnt.hasClass("has-sub")) {
            jqueryElmnt.parent().find(".open").removeClass("open");
        }
        else if (!jqueryElmnt.hasClass("open")) {
            var items = jqueryElmnt.parent().find(".open");
            for (var i = 0; i < items.length; i++) {
                var current = $(items[i]);
                if (current != jqueryElmnt) {
                    current.removeClass("open");
                }
            }
        }
    };
    TitleBarReplacerView.prototype.cleanHovered = function () {
        $(".app-menu .hovered").removeClass("hovered");
    };
    TitleBarReplacerView.prototype.cleanSelectedSub = function () {
        $(".app-menu .menu-item.selected").removeClass("selected");
    };
    TitleBarReplacerView.prototype.hideAll = function () {
        $(".app-menu span, .app-menu div").removeClass("open");
        this.cleanSelectedSub();
        this.cleanHovered();
    };
    TitleBarReplacerView.prototype.descendantOf = function (child, parent) {
        return ($(parent).find(child).length > 0);
    };
    TitleBarReplacerView.prototype.initMenuBar = function (elmnt) {
        var target;
        var run = false;
        //Style adjustments and event listeners
        if ((target = elmnt) && target.classList.contains("menu-item-keystroke"))
            run = true;
        else
            target = ".app-menu .menu-item-keystroke";
        if (!elmnt || run) {
            var keySpans = $(target);
            for (var i = 0; i < keySpans.length; i++) {
                if (keySpans[i].innerHTML == "") {
                    $(keySpans[i]).css("margin-left", "0px");
                }
            }
        }
        run = false;
        if ((target = elmnt) && target.classList.contains("menu-box"))
            run = true;
        else
            target = ".app-menu .menu-box";
        if (!elmnt || run) {
            var boxes = $(target);
            for (var i = 0; i < boxes.length; i++) {
                boxes[i].style.width = "";
                var w = $(boxes[i]).getHiddenDimensions(true).outerWidth;
                if (!($($(boxes[i]).parent()).hasClass("menu-label"))) {
                    $(boxes[i]).css("width", w + "px");
                }
                if ($(boxes[i]).hasClass("menu-item-submenu")) {
                    w = $(($(boxes[i]).parent())[0]).getHiddenDimensions(true).outerWidth;
                    $(boxes[i]).css("transform", "translate(" + (w - 24) + "px,-3px)");
                }
            }
        }
        run = false;
        if (!elmnt) {
            $(window).click(function () {
                $(".title-bar-replacer .app-menu .open").removeClass("open");
                _this.cleanSelectedSub();
                _this.cleanHovered();
                if (atom.config.get("title-bar-replacer.general.autoHide") && !_this.TitleBarReplacer.openCategory) {
                    _this.TitleBarReplacer.setMenuVisible(false);
                }
                _this.TitleBarReplacer.openCategory = false;
                _this.TitleBarReplacer.setAltOn(false);
                $(".title-bar-replacer .app-menu").removeClass("alt-down");
            });
        }
        if ((target = elmnt) && (target.classList.contains("menu-label") ||
            target.classList.contains("menu-box") ||
            target.classList.contains("menu-item")))
            run = true;
        else
            target = ".app-menu .menu-label, .app-menu .menu-box, .app-menu .menu-item";
        if (!elmnt || run) {
            $(target).click(function (event) {
                event.stopPropagation();
            });
        }
        run = false;
        if ((target = elmnt) && target.classList.contains("menu-label"))
            run = true;
        else
            target = ".app-menu .menu-label";
        if (!elmnt || run) {
            $(target).click(function () {
                $(".menu-label").removeClass("open");
                $(this).addClass("open");
            });
        }
        run = false;
        if ((target = elmnt) && target.classList.contains("menu-label"))
            run = true;
        else
            target = ".app-menu .menu-label";
        if (!elmnt || run) {
            $(target).mouseenter(function (e) {
                if (atom.config.get("title-bar-replacer.general.openAdjacent")) {
                    var labels = $(".menu-label.open");
                    var openLabel = (labels.length > 0);
                    if (openLabel && (e.target != labels[0]) && !_this.descendantOf(e.target, labels[0])) {
                        $(e.target).click();
                    }
                }
            });
        }
        run = false;
        if ((target = elmnt) && target.classList.contains("menu-item"))
            run = true;
        else
            target = ".app-menu .menu-item";
        if (!elmnt || run) {
            $(target).mouseenter(function (e) {
                e.stopPropagation();
                _this.cleanOpenClass($(this));
                _this.cleanSelectedSub();
                $(this).addClass("selected");
            });
        }
        run = false;
        if ((target = elmnt) && target.classList.contains("has-sub"))
            run = true;
        else
            target = ".app-menu .has-sub";
        if (!elmnt || run) {
            $(target).mouseenter(function (e) {
                $(this).addClass("open");
            });
        }
        run = false;
        //Handling command dispatching
        if ((target = elmnt) && (target.classList.contains("menu-item") && (!target.classList.contains(".has-sub") ||
            !target.classList.contains(".disabled"))))
            run = true;
        else
            target = ".app-menu .menu-item:not(.has-sub, .disabled)";
        if (!elmnt || run) {
            $(target).click(function () {
                var editorElement = atom.views.getView(atom.workspace.getActiveTextEditor());
                if (editorElement == null)
                    editorElement = atom.views.getView(atom.workspace.getActivePane());
                if (this.getAttribute("command") == "window:toggle-menu-bar") {
                    atom.commands.dispatch(editorElement, "title-bar-replacer:toggle-menu-bar");
                }
                else if (this.getAttribute("command") == "application:open-terms-of-use") {
                    shell.openExternal("https://help.github.com/articles/github-terms-of-service/");
                }
                else if (this.getAttribute("command") == "application:open-documentation") {
                    shell.openExternal("http://flight-manual.atom.io/");
                }
                else if (this.getAttribute("command") == "application:open-faq") {
                    shell.openExternal("https://atom.io/faq");
                }
                else if (this.getAttribute("command") == "application:open-discussions") {
                    shell.openExternal("https://discuss.atom.io/");
                }
                else if (this.getAttribute("command") == "application:report-issue") {
                    shell.openExternal("https://github.com/atom/atom/blob/master/CONTRIBUTING.md#submitting-issues");
                }
                else if (this.getAttribute("command") == "application:search-issues") {
                    shell.openExternal("https://github.com/atom/atom/issues");
                }
                else {
                    atom.commands.dispatch(editorElement, this.getAttribute("command"), JSON.parse(this.getAttribute("command-detail")));
                }
                if (!this.ignoreHide && atom.config.get("title-bar-replacer.general.closeOnDispatch")) {
                    _this.hideAll();
                }
                if (!this.ignoreHide && atom.config.get("title-bar-replacer.general.autoHide") && !_this.TitleBarReplacer.openCategory) {
                    _this.TitleBarReplacer.setMenuVisible(false);
                }
                this.ignoreHide = false;
                _this.TitleBarReplacer.openCategory = false;
                _this.TitleBarReplacer.setAltOn(false);
                $(".app-menu").removeClass("alt-down");
            });
        }
    };
    TitleBarReplacerView.prototype.initControls = function () {
        mainWindow = remote.getCurrentWindow();
        mainWindow.on("maximize", function () {
            $(".tbr-title-bar .tbr-maximize").html("control_restore");
        });
        mainWindow.on("unmaximize", function () {
            $(".tbr-title-bar .tbr-maximize").html("control_maximize");
        });
        mainWindow.on("enter-full-screen", function () {
            $(".tbr-title-bar .tbr-maximize").addClass("disabled");
            if (atom.config.get("title-bar-replacer.general.hideFullscreenTitle")) {
                $(".title-bar-replacer .tbr-title-bar").addClass("no-title-bar");
            }
        });
        mainWindow.on("leave-full-screen", function () {
            $(".tbr-title-bar .tbr-maximize").removeClass("disabled");
            if (atom.config.get("title-bar-replacer.general.displayTitleBar")) {
                $(".title-bar-replacer .tbr-title-bar").removeClass("no-title-bar");
            }
        });
        mainWindow.on("blur", function () {
            $(window).trigger("click");
        });
        $(".tbr-title-bar .tbr-close").click(function () {
            mainWindow.close();
        });
        $(".tbr-title-bar .tbr-maximize").click(function () {
            if (!mainWindow.isMaximized()) {
                mainWindow.maximize();
                $(".tbr-title-bar .tbr-maximize").html("control_restore");
            }
            else {
                mainWindow.unmaximize();
                $(".tbr-title-bar .tbr-maximize").html("control_maximize");
            }
        });
        $(".tbr-title-bar .tbr-minimize").click(function () {
            mainWindow.minimize();
        });
        if (mainWindow.isMaximized()) {
            $(".tbr-title-bar .tbr-maximize").html("control_restore");
        }
        else
            $(".tbr-title-bar .tbr-maximize").html("control_maximize");
    };
    //Assemble each menu category and populate submenus
    TitleBarReplacerView.prototype.deserializeLabels = function () {
        this.currentTemplate = JSON.parse(JSON.stringify(atom.menu.template)); // Deep clone menu template
        $(customMenu).empty();
        for (var i = 0; i < this.currentTemplate.length; i++) {
            if (!this.currentTemplate[i].label || !this.currentTemplate[i].submenu)
                continue; //Prevent crash upon accessing faulty menu items
            var menuLabel = document.createElement("span");
            menuLabel.classList.add("menu-label");
            var labelData = this.formatAltKey(this.currentTemplate[i].label);
            menuLabel.setAttribute("label", labelData.name);
            menuLabel.setAttribute("alt-trigger", labelData.key);
            menuLabel.innerHTML = labelData.html;
            var menu = document.createElement("div");
            menu.classList.add("menu-box");
            var traversed = this.traverseMenu(this.currentTemplate[i].submenu);
            //Sort packages alphabetically
            if (labelData.name == "Packages") {
                traversed.sort(function (a, b) {
                    var nameA = a.firstChild.innerHTML.toLowerCase(), nameB = b.firstChild.innerHTML.toLowerCase();
                    if (nameA < nameB)
                        return -1;
                    if (nameA > nameB)
                        return 1;
                    return 0;
                });
            }
            for (var j = 0; j < traversed.length; j++) {
                menu.appendChild(traversed[j]);
            }
            menuLabel.appendChild(menu);
            customMenu.appendChild(menuLabel);
        }
        this.firstBuildDone = true;
    };
    /**
     * Deserializes a single menu label object along with all submenu's, and inserts the menu label at
     * specified index.
     * @param  {TbrCore.MenuItem} labelObject The menu label object
     * @param  {number} 		  insertIndex The index at which the menu label should be inserted
     */
    TitleBarReplacerView.prototype.deserializeLabel = function (labelObject, insertIndex) {
        if (!labelObject.label || !labelObject.submenu)
            return; //Prevent crash upon accessing faulty menu items
        var menuLabel = document.createElement("span");
        menuLabel.classList.add("menu-label");
        var labelData = this.formatAltKey(labelObject.label);
        menuLabel.setAttribute("label", labelData.name);
        menuLabel.setAttribute("alt-trigger", labelData.key);
        menuLabel.innerHTML = labelData.html;
        var menu = document.createElement("div");
        menu.classList.add("menu-box");
        var traversed = this.traverseMenu(labelObject.submenu);
        traversed.forEach(function (elmnt) {
            menu.appendChild(elmnt);
        });
        menuLabel.appendChild(menu);
        customMenu.insertBefore(menuLabel, customMenu.children[insertIndex]);
        this.initMenuItem(menuLabel, menu);
    };
    TitleBarReplacerView.prototype.setCurrentTemplate = function (template) {
        this.currentTemplate = template;
    };
    TitleBarReplacerView.prototype.getCurrentTemplate = function () {
        return this.currentTemplate;
    };
    TitleBarReplacerView.prototype.updateMenu = function () {
        // var now = new Date().getTime();
        if (!this.firstBuildDone)
            return;
        this.MenuUpdater.run();
        // console.log("Menu update took: " + (new Date().getTime() - now) + "ms");
    };
    // Returns an object that can be retrieved when package is activated
    TitleBarReplacerView.prototype.serialize = function () {
        return this;
    };
    // Tear down any state and detach
    TitleBarReplacerView.prototype.destroy = function () {
        this.firstBuildDone = false;
        this.element.remove();
    };
    TitleBarReplacerView.prototype.getElement = function () {
        return this.element;
    };
    TitleBarReplacerView.prototype.traverseTemplate = function (menuArray) {
        return this.traverseMenu(menuArray);
    };
    TitleBarReplacerView.prototype.initMenuItem = function (item, menuBox) {
        var itemArray = $(item).find("div, span").toArray();
        itemArray.splice(0, 0, item);
        itemArray.forEach(function (o) {
            _this.initMenuBar(o);
        });
        if (menuBox) {
            itemArray = $(menuBox).find(".menu-box").toArray();
            itemArray.forEach(function (o) {
                _this.initMenuBar(o);
            });
        }
    };
    //Spawn menu bar labels without traversing the menu template as this is not finished at this point
    TitleBarReplacerView.prototype.spawnTempLabels = function (parent) {
        this.currentTemplate = atom.menu.template.slice(0);
        for (var i = 0; i < this.currentTemplate.length; i++) {
            if (!this.currentTemplate[i].label)
                continue; //Prevent crash upon accessing faulty menu items
            var menuLabel = document.createElement("span");
            menuLabel.classList.add("menu-label");
            var labelString = this.formatAltKey(this.currentTemplate[i].label).name;
            menuLabel.innerHTML = labelString;
            menuLabel.setAttribute("label", labelString);
            parent.appendChild(menuLabel);
        }
    };
    // Return an object that contains the html for a menu label, a plain-text label name, and the alt key that triggers this menu item
    TitleBarReplacerView.prototype.formatAltKey = function (string) {
        var key = string.match(/&./);
        if (key == null) {
            return { html: string, name: string, key: null };
        }
        key = this.removeAmp(key[0]);
        var html = string.replace("&" + key, "<u>" + key + "</u>");
        return { html: html, name: this.removeAmp(string), key: key.toLowerCase() };
    };
    TitleBarReplacerView.prototype.removeAmp = function (string) {
        return string.replace("&", "");
    };
    //Recursively traverse the menu template and assemble the custom menu
    TitleBarReplacerView.prototype.traverseMenu = function (menuArray) {
        var traversedElements = new Array();
        for (var i = 0; i < menuArray.length; i++) {
            if (menuArray[i].label == undefined && menuArray[i].type == "separator") {
                var separator = document.createElement("hr");
                traversedElements.push(separator);
                continue;
            }
            if (menuArray[i].visible == false)
                continue;
            var menuItem = document.createElement("div");
            menuItem.classList.add("menu-item");
            if (menuArray[i].enabled == false)
                menuItem.classList.add("disabled");
            var altData = this.formatAltKey(menuArray[i].label);
            var s = altData.html;
            menuItem.setAttribute("alt-trigger", altData.key);
            if (menuArray[i].label == "VERSION")
                s = "Version " + atom.appVersion;
            var menuItemName = document.createElement("span");
            menuItemName.classList.add("menu-item-name");
            menuItemName.innerHTML = s;
            var menuItemKeystroke = document.createElement("span");
            menuItemKeystroke.classList.add("menu-item-keystroke");
            menuItem.appendChild(menuItemName);
            menuItem.appendChild(menuItemKeystroke);
            if (menuArray[i].submenu != undefined) {
                menuItem.classList.add("has-sub");
                var menu = document.createElement("div");
                menu.classList.add("menu-box", "menu-item-submenu");
                var traversed = this.traverseMenu(menuArray[i].submenu); // Recurse
                for (var j = 0; j < menuArray[i].submenu.length; j++) {
                    if (traversed[j] == undefined)
                        continue;
                    menu.appendChild(traversed[j]);
                }
                menuItem.appendChild(menu);
            }
            else if (menuArray[i].command != undefined) {
                menuItem.setAttribute("command", menuArray[i].command);
                if (menuArray[i].commandDetail) {
                    menuItem.setAttribute("command-detail", JSON.stringify(menuArray[i].commandDetail));
                }
                var strokeArray = atom.keymaps.findKeyBindings({
                    command: menuItem.getAttribute("command")
                });
                if (strokeArray.length == 0) {
                    traversedElements.push(menuItem);
                    continue;
                }
                // Splice out all key strokes that target an irrelevant context
                var relSelectors = [
                    "body",
                    "atom-text-editor",
                    "atom-text-editor:not([mini])",
                    "atom-workspace",
                    "atom-workspace atom-text-editor",
                    "atom-workspace atom-text-editor:not([mini])",
                    ".workspace"
                ];
                for (var j = 0; j < strokeArray.length; j++) {
                    if (strokeArray[j].selector.includes(".platform-"))
                        continue;
                    var selectors = strokeArray[j].selector + ",";
                    var currSelectors = selectors.match(/(?!,)[^,]+(?=,)/g);
                    if (!currSelectors)
                        continue;
                    var noMatches = true;
                    for (var k = 0; k < currSelectors.length; k++) {
                        for (var l = 0; l < relSelectors.length; l++) {
                            if (currSelectors[k] == relSelectors[l])
                                noMatches = false;
                        }
                    }
                    if (noMatches)
                        strokeArray.splice(j, 1);
                }
                var keystroke;
                if (strokeArray.length > 1) {
                    keystroke = this.getPlatformSpecificKeystroke(strokeArray);
                }
                else if (strokeArray.length == 1) {
                    var platform = this.getPlatformKeystroke(strokeArray[0]);
                    if (platform == null || platform == process.platform)
                        keystroke = strokeArray[0].keystrokes;
                }
                if (keystroke != undefined)
                    menuItemKeystroke.innerHTML = keystroke;
            }
            traversedElements.push(menuItem);
        }
        return traversedElements;
    };
    TitleBarReplacerView.prototype.getPlatformKeystroke = function (keystrokeObj) {
        if (keystrokeObj.selector.includes("win32")) {
            return "win32";
        }
        else if (keystrokeObj.selector.includes("darwin")) {
            return "darwin";
        }
        else if (keystrokeObj.selector.includes("linux")) {
            return "linux";
        }
        return null;
    };
    //An attempt at getting the most relevant keystroke
    TitleBarReplacerView.prototype.getPlatformSpecificKeystroke = function (keystrokeArray) {
        for (var i = 0; i < keystrokeArray.length; i++) {
            var platform = this.getPlatformKeystroke(keystrokeArray[i]);
            if (platform == process.platform) {
                return keystrokeArray[i].keystrokes;
            }
        }
        return keystrokeArray[keystrokeArray.length - 1].keystrokes;
    };
    TitleBarReplacerView.prototype.initTitleListener = function (titleSpan) {
        setInterval(function () {
            var title = $("title")[0];
            if (!title || !title.innerHTML)
                return;
            var oldTitle = titleSpan.innerHTML;
            var newTitle = title.innerHTML;
            if (oldTitle != newTitle) {
                titleSpan.innerHTML = newTitle;
            }
        }, 200);
    };
    return TitleBarReplacerView;
}());
exports.default = TitleBarReplacerView;
(function ($) {
    $.fn.getHiddenDimensions = function (includeMargin) {
        var $item = this, props = {
            position: 'absolute',
            visibility: 'hidden',
            display: 'block'
        }, dim = {
            width: 0,
            height: 0,
            innerWidth: 0,
            innerHeight: 0,
            outerWidth: 0,
            outerHeight: 0
        }, $hiddenParents = $item.parents().not(':visible'), includeMargin = (includeMargin == null) ? false : includeMargin;
        var oldProps = [];
        $hiddenParents.each(function () {
            var old = {};
            for (var name in props) {
                old[name] = this.style[name];
                this.style[name] = props[name];
            }
            oldProps.push(old);
        });
        dim.width = $item.width();
        dim.outerWidth = $item.outerWidth(includeMargin);
        dim.innerWidth = $item.innerWidth();
        dim.height = $item.height();
        dim.innerHeight = $item.innerHeight();
        dim.outerHeight = $item.outerHeight(includeMargin);
        $hiddenParents.each(function (i) {
            var old = oldProps[i];
            for (var name in props) {
                this.style[name] = old[name];
            }
        });
        return dim;
    };
}(jQuery));
