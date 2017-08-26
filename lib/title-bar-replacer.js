'use babel';

import TitleBarReplacerView from "./title-bar-replacer-view";
import WindowFrameRemover from "./window-frame-remover";
import { CompositeDisposable } from "atom";
$ = jQuery = require("jquery");
ConfigSchema = require("./configuration.coffee");
const { shell } = require('electron');

var closeOnDispatch = true;
var packageReady = false;
var openCategory = false;
var menuToggleAllowed = true;
var altOn = false;

export default {
    config: ConfigSchema.config,

    titleBarReplacer: null,
    titleBarReplacerView: null,
    titleBarPanel: null,
    subscriptions: null,

    activate(state) {
        titleBarReplacer = this;
        this.titleBarReplacerView = new TitleBarReplacerView(state.titleBarReplacerViewState);
        this.titleBarPanel = this.titleBarReplacerView.getElement();
        $(".workspace").prepend(this.titleBarPanel);
        this.titleBarReplacerView.initButtons();
        this.titleBarReplacerView.spawnTemp();

        this.windowFrameRemover = new WindowFrameRemover();

        var titleBarClass = this;
        var intervalID = setInterval(function() {
            if ($("atom-pane-container.panes").css("display") == "flex") {
                clearInterval(intervalID);
                titleBarClass.titleBarReplacerView.initMenuBar();
                initMenuBar();
                packageReady = true;
            }
        }, 50);

        this.subscriptions = new CompositeDisposable();

        // Register commands
        this.subscriptions.add(atom.commands.add('atom-workspace', {
            'title-bar-replacer:toggle-menu-bar': () => this.toggleMenuBar(),
            'title-bar-replacer:restore-defaults': () => resetSettings(),
            'title-bar-replacer:auto-select-colours': () => this.toggleAutoColor(),
            'title-bar-replacer:remove-window-frame': () => this.runFrameRemover()
        }));

        atom.views.getView(atom.workspace).addEventListener('keyup', function(e) {
            keyHandler(e);
        });

        atom.config.observe('title-bar-replacer.general.displayMenu', (function(_this) {
            return function(value) {
                return _this.displayMenuBar(value);
            };
        })(this));
        atom.config.observe("title-bar-replacer.general.autoHide", (function(_this) {
            return function(value) {
                if (value)
                    return _this.displayMenuBar(false);

                return _this.displayMenuBar(atom.config.get("title-bar-replacer.general.displayMenu"));
            };
        })(this));
        atom.config.observe("title-bar-replacer.general.hideFullscreenTitle", (function(_this) {
            return function(value) {
                return _this.fullscreenTitleBar(value);
            };
        })(this));
        atom.config.onDidChange('title-bar-replacer.general.closeOnDispatch', function(value) {
            closeOnDispatch = value.newValue;
        });
        atom.config.observe('title-bar-replacer.colours.navColour', (function(_this) {
            return function(value) {
                var selector = ".custom-title-bar .menu-div i::before";
                clearRule(selector);
                getStyleSheet().insertRule(
                    selector + "{ background-color: " + value.toHexString() + " }", getStyleSheet().cssRules.length
                );
            };
        })(this));
        atom.config.onDidChange('title-bar-replacer.colours.autoSelectColour', function(value) {
            titleBarReplacer.toggleAutoColor(value.newValue);
        });
        atom.config.observe('title-bar-replacer.colours.baseColour', (function(_this) {
            return function(value) {
                if (!_this.isAutoColour()) setCustomColours();
            };
        })(this));
        atom.config.observe('title-bar-replacer.colours.highlightColour', (function(_this) {
            return function(value) {
                if (!_this.isAutoColour()) setCustomColours();
            };
        })(this));
        atom.config.observe('title-bar-replacer.colours.textColour', (function(_this) {
            return function(value) {
                if (!_this.isAutoColour()) setCustomColours();
            };
        })(this));
        atom.config.onDidChange('title-bar-replacer.configuration.restoreDefaults', function(value) {
            if (value.newValue) resetSettings();
        });
        atom.config.onDidChange('title-bar-replacer.configuration.removeFrame', function(value) {
            if (value.newValue) titleBarReplacer.windowFrameRemover.run();
            setTimeout(function() {
                atom.config.set("title-bar-replacer.configuration.removeFrame", ConfigSchema.config.configuration.properties.removeFrame.default);
            }, 600);
        });
    },

    deactivate() {
        this.titleBarPanel.destroy();
        this.subscriptions.dispose();
        this.titleBarReplacerView.destroy();
    },

    serialize() {
        return {
            titleBarReplacerViewState: this.titleBarReplacerView.serialize()
        };
    },

    toggleMenuBar() {
        var setTo = !this.titleBarPanel.isMenuVisible();
        this.displayMenuBar(setTo);
        atom.config.set("title-bar-replacer.general.displayMenu", setTo);
        return setTo;
    },

    displayMenuBar(bool) {
        setMenuVisible(bool);
    },

    fullscreenTitleBar(bool) {
        if (bool && atom.getCurrentWindow().isFullScreen())
            $(".custom-title-bar").addClass("no-title-bar");
        else $(".custom-title-bar").removeClass("no-title-bar");
    },

    isAutoColour() {
        return atom.config.get("title-bar-replacer.colours.autoSelectColour");
    },

    toggleAutoColor(bool) {
        if (bool == undefined)
            bool = !this.isAutoColour();
        atom.config.set("title-bar-replacer.colours.autoSelectColour", bool);
        if (bool) {
            atom.notifications.addSuccess("Auto Colour component enabled");
            clearCustomColours();
        } else {
            atom.notifications.addInfo("Auto Colour component disabled");
            setCustomColours();
        }
    },

    runFrameRemover() {
        this.windowFrameRemover.run();
    }

};

function isMenuVisible() {
    return ($(".custom-menu").css("display") != "none");
}

function setMenuVisible(bool) {
    if (bool) $(".custom-menu").css("display", "block");
    else $(".custom-menu").css("display", "none");
}

function keyHandler(keyEvent) {
    if (!packageReady) return;

    if (keyEvent.keyCode == 18 && keyEvent.ctrlKey == false && keyEvent.code != "AltRight") { //alt key
        if (menuToggleAllowed && atom.config.get("title-bar-replacer.general.autoHide")) {
            if ($(".custom-menu .menu-label.open").length > 0){
                openCategory = true;
                $(window).click();
            }
            else {
                setMenuVisible(!isMenuVisible());
            }
        }
        menuToggleAllowed = true;
    }
}

function resetSettings() {
    var c = ConfigSchema.config;
    atom.config.set("title-bar-replacer.general.displayMenu", c.general.properties.displayMenu.default);
    atom.config.set("title-bar-replacer.general.closeOnDispatch", c.general.properties.closeOnDispatch.default);
    atom.config.set("title-bar-replacer.general.openAdjacent", c.general.properties.openAdjacent.default);
    atom.config.set("title-bar-replacer.general.autoHide", c.general.properties.autoHide.default);
    atom.config.set("title-bar-replacer.general.hideFullscreenTitle", c.general.properties.hideFullscreenTitle.default);
    atom.config.set("title-bar-replacer.colours.navColour", c.colours.properties.navColour.default);
    atom.config.set("title-bar-replacer.colours.autoSelectColour", c.colours.properties.autoSelectColour.default);
    atom.config.set("title-bar-replacer.colours.baseColour", c.colours.properties.baseColour.default);
    atom.config.set("title-bar-replacer.colours.highlightColour", c.colours.properties.highlightColour.default);
    atom.config.set("title-bar-replacer.colours.textColour", c.colours.properties.textColour.default);
    setTimeout(function() {
        atom.config.set("title-bar-replacer.configuration.restoreDefaults", c.configuration.properties.restoreDefaults.default);
    }, 300);
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

function clearRule(selector) {
    var sheet = getStyleSheet();
    for (var i = 0; i < sheet.cssRules.length; i++) {
        if (sheet.cssRules[i].selectorText == selector) {
            sheet.removeRule(i);
        }
    }
    return sheet;
}

function clearCustomColours() {
    var base = [
        ".custom-title-bar",
        ".custom-menu .menu-label.open, .custom-menu .menu-label:hover", //10% darker
        ".custom-menu .menu-label .menu-box" //ligther
    ];
    var hi = ".custom-menu .menu-label .menu-box .menu-item.open, .custom-menu .menu-label .menu-box .menu-item:hover";
    var txt = [
        ".custom-title-bar",
        ".custom-title-bar .custom-title, .custom-menu .menu-label .menu-box hr, .custom-menu .menu-label .menu-box .menu-item .menu-item-keystroke", //subtle
        ".menu-div i, .menu-div i.disabled, .custom-menu .menu-label .menu-box .menu-item" //highlight
    ];

    for (var i = 0; i < base.length; i++) {
        clearRule(base[i]);
    }
    clearRule(hi);
    for (var i = 0; i < txt.length; i++) {
        clearRule(txt[i]);
    }
}

function setCustomColours() {
    var sheet = getStyleSheet();

    var base = [
        ".custom-title-bar",
        ".custom-menu .menu-label.open, .custom-menu .menu-label:hover", //10% darker
        ".custom-menu .menu-label .menu-box" //ligther
    ];
    var hi = ".custom-menu .menu-label .menu-box .menu-item.open, .custom-menu .menu-label .menu-box .menu-item:hover";
    var txt = [
        ".custom-title-bar",
        ".custom-title-bar .custom-title, .custom-menu .menu-label .menu-box hr, .custom-menu .menu-label .menu-box .menu-item .menu-item-keystroke", //subtle
        ".menu-div i, .menu-div i.disabled, .custom-menu .menu-label .menu-box .menu-item" //highlight
    ];

    var colourBase = atom.config.get("title-bar-replacer.colours.baseColour").toHexString();
    var colourHighlight = atom.config.get("title-bar-replacer.colours.highlightColour").toHexString();
    var colourText = atom.config.get("title-bar-replacer.colours.textColour").toHexString();

    for (var i = 0; i < base.length; i++) {
        clearRule(base[i]);
    }
    clearRule(hi);
    for (var i = 0; i < txt.length; i++) {
        clearRule(txt[i]);
    }

    var factor = (getLuminance(colourBase) >= 0.5 ? -1 : 1);
    sheet.insertRule(base[0] + "{ background-color: " + colourBase + " !important }", sheet.cssRules.length);
    sheet.insertRule(base[1] + "{ background-color: " + shadeColor(colourBase, (-0.4) * factor) + " !important }", sheet.cssRules.length);
    sheet.insertRule(base[2] + "{ background-color: " + shadeColor(colourBase, (0.1) * factor) + " !important }", sheet.cssRules.length);

    sheet.insertRule(hi + "{ background-color: " + colourHighlight + " !important }", sheet.cssRules.length);

    factor = (getLuminance(colourText) >= 0.5 ? -1 : 1);
    sheet.insertRule(txt[0] + "{ color: " + colourText + " !important }", sheet.cssRules.length);
    sheet.insertRule(txt[1] + "{ color: " + shadeColor(colourText, (0.25) * factor) + " !important }", sheet.cssRules.length);
    sheet.insertRule(txt[2] + "{ color: " + shadeColor(colourText, (-0.4) * factor) + " !important }", sheet.cssRules.length);
}

function shadeColor(hexcolor, frac) {
    var f = parseInt(hexcolor.slice(1), 16),
        t = frac < 0 ? 0 : 255,
        p = frac < 0 ? frac * -1 : frac,
        R = f >> 16,
        G = f >> 8 & 0x00FF,
        B = f & 0x0000FF;
    return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
}

//0.0: darkest, 1.0: lightest
function getLuminance(hexcolor) {
    if (hexcolor.includes("#")) hexcolor = hexcolor.slice(1);
    //Convert the 'RRGGBB' to their decimal values
    var r = parseInt(hexcolor.substr(0, 2), 16);
    var g = parseInt(hexcolor.substr(2, 2), 16);
    var b = parseInt(hexcolor.substr(4, 2), 16);
    //Calculate the 'y' of the YIQ colour model
    var y = (r * 299 + g * 587 + b * 114) / 1000;
    return (y / 255);
}

function descendantOf(child, parent) {
    return ($(parent).find(child).length > 0);
}

function initMenuBar() {

    var switchCategory = function(direction) {

        var target = $(".custom-menu .menu-label.hovered, .custom-menu .menu-label.open");

        var focusCategory = function() {
            if (target.length == 0) {
                switch(direction) {
                    case "right":
                        $(".custom-menu .menu-label").first().addClass("hovered");
                        break;
                    case "left":
                        $(".custom-menu .menu-label").last().addClass("hovered");
                }
                return true;
            }
            return false;
        }

        if (!focusCategory()) {
            var target;
            switch(direction) {
                case "right":
                    var target = target.next();
                    break;
                case "left":
                    var target = target.prev();
            }
            cleanHovered();
            target.addClass("hovered");
        }

    }

    //Keyboard navigation
    $("atom-workspace").keydown(function(e) {

        if (altOn && $(".custom-menu .menu-label.open").length == 0) {
            e.stopPropagation();
            e.preventDefault();

            if (e.which == 39) { //arrow right
                switchCategory("right");
            }
            else if (e.which == 37) { //arrow left
                switchCategory("left");
            }
            else if (e.which == 27) { //escape
                $(window).trigger("click");
            }
        }

        //Alt shortcuts
        if (altOn && e.originalEvent.repeat == false) {
            if (e.which == 18 && !(e.altKey && e.ctrlKey)) {
                menuToggleAllowed = false;
                $(window).trigger("click");
                return;
            }

            e.stopPropagation();
            e.preventDefault();

            var key = e.key.toLowerCase();
            var targets;

            if ($(".custom-menu .menu-label.open").length == 0) {
                targets = $(".custom-menu .menu-label");
            } else {
                targets = $(".custom-menu span.open > .menu-box, .custom-menu div.open > .menu-box").last().children();
            }

            for (var i = 0; i < targets.length; i++) {
                if (targets[i].altTrigger == key) {
                    $(targets[i]).trigger("click");
                    return;
                }
            }

            var target = $(".custom-menu .menu-label.hovered");
            if ((e.which == 32 || e.which == 13 || e.which == 40) && target.length > 0) { //space || enter || arrow down
                target.trigger("click");
                cleanHovered();
            }
        }
        else if (e.which == 18 && !(e.altKey && e.ctrlKey) && !e.shiftKey && e.originalEvent.repeat == false) { //alt, disable altGraph
            altOn = true;
            $(".custom-menu").addClass("alt-down");
        }

        //Close menu if open and alt is pressed
        if ((e.which == 18 && !(e.altKey && e.ctrlKey) && e.originalEvent.repeat == false) && $(".custom-menu .menu-label.open").length != 0) {
            menuToggleAllowed = false;
            $(window).trigger("click");
        }



        if ($(".custom-title-bar .menu-label.open").length > 0) {
            e.stopPropagation();
            e.preventDefault();
            var target;

            var selectFirst = function() {
                if ($(".custom-menu .menu-label.open .menu-item.selected").length == 0) {
                    target = $(".custom-menu .menu-label.open .menu-item").first();
                    target.trigger("mouseenter");
                    target.removeClass("open");
                    return true;
                }
                return false;
            }

            target = $(".custom-menu .menu-label.open .menu-item.selected").last();

            if (e.which == 38) { //arrow up
                if (selectFirst()) return;
                parent = target.parent().parent();
                target = target.prev();
                if (target.length == 0 && parent.hasClass("menu-label")) {
                    parent.removeClass("open");
                    parent.addClass("hovered");
                    altOn = true;
                    $(".custom-menu").addClass("alt-down");
                    return;
                }
                while (target.length != 0 && target.prop("nodeName") != "DIV") {
                    target = target.prev();
                }
                target.trigger("mouseenter");
                target.removeClass("open");
            }
            else if (e.which == 40) { //arrow down
                if (selectFirst()) return;
                target = target.next();
                while (target.length != 0 && target.prop("nodeName") != "DIV") {
                    target = target.next();
                }
                target.trigger("mouseenter");
                target.removeClass("open");
            }

            else if (e.which == 37) { //arrow left
                $(".custom-menu .menu-item.has-sub.open").last().trigger("mouseenter");
                if (!target.parent().parent().hasClass("menu-label"))
                    target.parent().parent().removeClass("open");
                else {
                    switchCategory("left");
                    hideAll();
                    altOn = true;
                    $(".custom-menu").addClass("alt-down");
                }
            }
            else if (e.which == 39) { //arrow right
                if (!target.hasClass("has-sub")) {
                    switchCategory("right");
                    hideAll();
                    altOn = true;
                    $(".custom-menu").addClass("alt-down");
                    return;
                }

                target.addClass("open");
                target = target.find(".menu-item").first();
                target.trigger("mouseenter");
            }

            //Execute command
            else if (e.which == 13) { //enter
                target.trigger("click");
            }
            //Close menu
            else if (e.which == 27) { //escape
                $(window).trigger("click");
            }
        }
    });

    //Event listeners
    var titleString = $("title")[0].innerHTML;
    $(".custom-title")[0].innerHTML = titleString;

    var menus = $(".custom-menu .menu-item-submenu");
    for (var i = 0; i < menus.length; i++) {
        $(($(menus[i]).parent())[0]).addClass("has-sub");
    }

    var keySpans = $(".custom-menu .menu-item-keystroke");
    for (var i = 0; i < keySpans.length; i++) {
        if (keySpans[i].innerHTML == "") {
            $(keySpans[i]).css("margin-left", "0px");
        }
    }

    var boxes = $(".custom-menu .menu-box");
    for (var i = 0; i < boxes.length; i++) {
        var w = $(boxes[i]).getHiddenDimensions(true).outerWidth;
        if (!($($(boxes[i]).parent()).hasClass("menu-label"))) {
            $(boxes[i]).css("width", w + "px");
        }
        if ($(boxes[i]).hasClass("menu-item-submenu")) {
            w = $(($(boxes[i]).parent())[0]).getHiddenDimensions(true).outerWidth;
            $(boxes[i]).css("transform", "translate(" + (w - 24) + "px,-3px)");
        }
    }

    $(window).click(function() {
        $(".custom-menu .open").removeClass("open");
        cleanSelectedSub();
        cleanHovered();

        if (atom.config.get("title-bar-replacer.general.autoHide") && !openCategory) {
            setMenuVisible(false);
        }
        openCategory = false;
        altOn = false;
        $(".custom-menu").removeClass("alt-down");
    });

    $(".custom-menu .menu-label, .custom-menu .menu-box, .custom-menu .menu-item").click(function(event) {
        event.stopPropagation();
    });

    $(".custom-menu .menu-label").click(function() {
        $(".menu-label").removeClass("open");
        $(this).addClass("open");
    });

    $(".custom-menu .menu-label").mouseenter(function(e) {
        if (atom.config.get("title-bar-replacer.general.openAdjacent")) {
            var labels = $(".menu-label.open");
            var openLabel = (labels.length > 0);
            if (openLabel && (e.target != labels[0]) && !descendantOf(e.target, labels[0])) {
                $(e.target).click();
            }
        }
    });

    $(".custom-menu .menu-item").mouseenter(function(e) {
        e.stopPropagation();
        cleanOpenClass($(this));
        cleanSelectedSub();
        $(this).addClass("selected");
    });

    $(".custom-menu .has-sub").mouseenter(function(e) {
        $(this).addClass("open");
    });

    //Handling command dispatching
    $(".custom-menu .menu-item").not(".has-sub, .disabled").click(function() {
        var editorElement = atom.views.getView(atom.workspace.getActiveTextEditor());
        if (editorElement == null) editorElement = atom.views.getView(atom.workspace.getActivePane());
        if (this.command == "window:toggle-menu-bar") {
            atom.commands.dispatch(editorElement, "title-bar-replacer:toggle-menu-bar");
        }
        else if (this.command == "application:open-terms-of-use") {
            shell.openExternal("https://help.github.com/articles/github-terms-of-service/");
        }
        else if (this.command == "application:open-documentation") {
            shell.openExternal("http://flight-manual.atom.io/");
        }
        else if (this.command == "application:open-faq") {
            shell.openExternal("https://atom.io/faq");
        }
        else if (this.command == "application:open-discussions") {
            shell.openExternal("https://discuss.atom.io/");
        }
        else if (this.command == "application:report-issue") {
            shell.openExternal("https://github.com/atom/atom/blob/master/CONTRIBUTING.md#submitting-issues");
        }
        else if (this.command == "application:search-issues") {
            shell.openExternal("https://github.com/atom/atom/issues");
        }
        else {
            atom.commands.dispatch(editorElement, this.command);
        }
        if (closeOnDispatch) {
            hideAll();
        }
        if (atom.config.get("title-bar-replacer.general.autoHide") && !openCategory) {
            setMenuVisible(false);
        }
        openCategory = false;
        altOn = false;
        $(".custom-menu").removeClass("alt-down");
    });
}

function cleanOpenClass(jqueryElmnt) {
    if (!jqueryElmnt.hasClass("has-sub")) {
        jqueryElmnt.parent().find(".open").removeClass("open");
    } else if (!jqueryElmnt.hasClass("open")) {
        var items = jqueryElmnt.parent().find(".open");
        for (var i = 0; i < items.length; i++) {
            var current = $(items[i]);
            if (current != jqueryElmnt) {
                current.removeClass("open");
            }
        }
    }
}

function cleanHovered() {
    $(".custom-menu .hovered").removeClass("hovered");
}

function cleanSelectedSub() {
    $(".custom-menu .menu-item.selected").removeClass("selected");
}

function hideAll() {
    $(".custom-menu span, .custom-menu div").removeClass("open");
    cleanSelectedSub();
}

function isJqueryVisible(jqueryElmnt) {
    return (jqueryElmnt.css("display") != "none");
}

function hideJqueryElmnt(jqueryElmnt) {
    jqueryElmnt.css("display", "none");
}

function toggleJqueryElmnt(jqueryElmnt) {
    var d = (jqueryElmnt.css("display") == "none") ? "initial" : "none";
    jqueryElmnt.css("display", d);
}

(function($) {
    $.fn.getHiddenDimensions = function(includeMargin) {
        var $item = this,
            props = {
                position: 'absolute',
                visibility: 'hidden',
                display: 'block'
            },
            dim = {
                width: 0,
                height: 0,
                innerWidth: 0,
                innerHeight: 0,
                outerWidth: 0,
                outerHeight: 0
            },
            $hiddenParents = $item.parents().not(':visible'),
            includeMargin = (includeMargin == null) ? false : includeMargin;

        var oldProps = [];
        $hiddenParents.each(function() {
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

        $hiddenParents.each(function(i) {
            var old = oldProps[i];
            for (var name in props) {
                this.style[name] = old[name];
            }
        });

        return dim;
    }
}(jQuery));
