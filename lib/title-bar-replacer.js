'use babel';

import TitleBarReplacerView from "./title-bar-replacer-view";
import WindowFrameRemover from "./window-frame-remover";
import { CompositeDisposable } from "atom";
$ = jQuery = require("jquery");
ConfigSchema = require("./configuration.coffee");

var _this;
var closeOnDispatch = true;
var packageReady = false;
var menuToggleAllowed = true;
var altOn = false;

export default {
    config: ConfigSchema.config,

    titleBarReplacer: null,
    titleBarReplacerView: null,
    titleBarPanel: null,
    subscriptions: null,
    openCategory: false,

    activate(state) {
        _this = titleBarReplacer = this;
        this.titleBarReplacerView = new TitleBarReplacerView({ state: state.titleBarReplacerViewState, TitleBarReplacer: this });
        this.titleBarPanel = this.titleBarReplacerView.getElement();
        $(".workspace").prepend(this.titleBarPanel);
        this.titleBarReplacerView.initButtons();
        this.titleBarReplacerView.spawnTemp();

        this.windowFrameRemover = new WindowFrameRemover();

        var intervalID = setInterval(function() {
            if ($("atom-pane-container.panes").css("display") == "flex") {
                clearInterval(intervalID);
                initKeyListeners();
                _this.titleBarReplacerView.deserializeLabels();
                _this.titleBarReplacerView.initMenuBar();
                _this.titleBarReplacerView.updateMenu();
                packageReady = true;
            }
        }, 50);

        atom.menu.update = (function(prev) {
            function extendUpdate() {
                prev.apply(atom.menu);
                if (packageReady)
                    _this.titleBarReplacerView.updateMenu();
            }

            return extendUpdate;
        })(atom.menu.update);

        this.subscriptions = new CompositeDisposable();

        // Register commands
        this.subscriptions.add(atom.commands.add('atom-workspace', {
            'title-bar-replacer:toggle-title-bar': () => this.toggleTitleBar(),
            'title-bar-replacer:toggle-menu-bar': () => this.toggleMenuBar(),
            'title-bar-replacer:restore-defaults': () => resetSettings(),
            'title-bar-replacer:auto-select-colours': () => this.toggleAutoColor(),
            'title-bar-replacer:remove-window-frame': () => this.runFrameRemover()
        }));

        atom.views.getView(atom.workspace).addEventListener('keyup', function(e) {
            keyHandler(e);
        });

        atom.config.observe('title-bar-replacer.general.displayTitleBar', (function(_this) {
            return function(value) {
                return _this.displayTitleBar(value);
            };
        })(this));
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
                var selector = ".title-bar-replacer .tbr-title-bar i::before";
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

    toggleTitleBar() {
        var setTo = $(".title-bar-replacer").hasClass("no-title-bar");
        this.displayTitleBar(setTo);
        atom.config.set("title-bar-replacer.general.displayTitleBar", setTo);
        return setTo;
    },

    toggleMenuBar() {
        var setTo = !this.titleBarPanel.isMenuVisible();
        this.displayMenuBar(setTo);
        atom.config.set("title-bar-replacer.general.displayMenuBar", setTo);
        return setTo;
    },

    displayTitleBar(bool) {
        if (bool)
            $(".title-bar-replacer").removeClass("no-title-bar");
        else $(".title-bar-replacer").addClass("no-title-bar");
    },

    displayMenuBar(bool) {
        setMenuVisible(bool);
    },

    fullscreenTitleBar(bool) {
        if (bool && atom.getCurrentWindow().isFullScreen())
            $(".title-bar-replacer").addClass("no-title-bar");
        else $(".title-bar-replacer").removeClass("no-title-bar");
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
    },

	setAltOn(bool) {
		altOn = bool;
	}

};

function isMenuVisible() {
    return ($(".app-menu").css("display") != "none");
}

function setMenuVisible(bool) {
    if (bool) $(".app-menu").css("display", "block");
    else $(".app-menu").css("display", "none");
}

function keyHandler(keyEvent) {
    if (!packageReady) return;

    if (keyEvent.keyCode == 18 && keyEvent.ctrlKey == false && keyEvent.shiftKey == false && keyEvent.code != "AltRight") { //alt key
        if (menuToggleAllowed && atom.config.get("title-bar-replacer.general.autoHide")) {
            if ($(".app-menu .menu-label.open").length > 0){
                _this.openCategory = true;
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
        ".title-bar-replacer",
        ".app-menu .menu-label.open, .app-menu .menu-label:hover", //10% darker
        ".app-menu .menu-label .menu-box" //ligther
    ];
    var hi = ".app-menu .menu-label .menu-box .menu-item.open, .app-menu .menu-label .menu-box .menu-item:hover";
    var txt = [
        ".title-bar-replacer",
        ".title-bar-replacer .custom-title, .app-menu .menu-label .menu-box hr, .app-menu .menu-label .menu-box .menu-item .menu-item-keystroke", //subtle
        ".tbr-title-bar i, .tbr-title-bar i.disabled, .app-menu .menu-label .menu-box .menu-item" //highlight
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
        ".title-bar-replacer",
        ".app-menu .menu-label.open, .app-menu .menu-label:hover", //10% darker
        ".app-menu .menu-label .menu-box" //ligther
    ];
    var hi = ".app-menu .menu-label .menu-box .menu-item.open, .app-menu .menu-label .menu-box .menu-item:hover";
    var txt = [
        ".title-bar-replacer",
        ".title-bar-replacer .custom-title, .app-menu .menu-label .menu-box hr, .app-menu .menu-label .menu-box .menu-item .menu-item-keystroke", //subtle
        ".tbr-title-bar i, .tbr-title-bar i.disabled, .app-menu .menu-label .menu-box .menu-item" //highlight
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

function initKeyListeners() {

    var switchCategory = function(direction) {

        var target = $(".app-menu .menu-label.hovered, .app-menu .menu-label.open");

        var focusCategory = function() {
            if (target.length == 0) {
                switch(direction) {
                    case "right":
                        $(".app-menu .menu-label").first().addClass("hovered");
                        break;
                    case "left":
                        $(".app-menu .menu-label").last().addClass("hovered");
                }
                return true;
            }
            return false;
        }

        if (!focusCategory()) {
            switch(direction) {
                case "right":
                    target = target.next();
                    break;
                case "left":
                    target = target.prev();
            }
            _this.titleBarReplacerView.hideAll();
            target.addClass("hovered");
        }

    }

    //Keyboard navigation
    $("atom-workspace").keydown(function(e) {

        if (altOn && $(".app-menu .menu-label.open").length == 0) {

            if (e.which == 39) { //arrow right
                intercept(e);
                switchCategory("right");
            }
            else if (e.which == 37) { //arrow left
                intercept(e);
                switchCategory("left");
            }
            else if (e.which == 27) { //escape
                intercept(e);
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

            var key = e.key.toLowerCase();
            var targets;

            if ($(".app-menu .menu-label.open").length == 0) {
                targets = $(".app-menu .menu-label");
            } else {
                targets = $(".app-menu span.open > .menu-box, .app-menu div.open > .menu-box").last().children();
            }

            var dispatched = false;
            for (var i = 0; i < targets.length; i++) {
                if (targets[i].altTrigger == key) {
                    dispatched = true;
                    $(targets[i]).trigger("click");
                    break;
                }
            }

            if (dispatched) {
                intercept(e);
                return;
            }

            var target = $(".app-menu .menu-label.hovered");
            if ((e.which == 32 || e.which == 13 || e.which == 40) && target.length > 0) { //space || enter || arrow down
                target.trigger("click");
                _this.titleBarReplacerView.cleanHovered();
            }
            // Disable alt mode if no command was dispatched and the pressed key was irrelevant
            else if (!dispatched && e.which != 37 && e.which != 38 && e.which != 39 && e.which != 40
                    && e.which != 32 && e.which != 13 && e.which != 27 && e.which != 18) {// arrow left | arrow up | arrow right | arrow down | space | enter | escape | alt
                $(window).trigger("click");
                menuToggleAllowed = false;
            }
        }
        else if (e.which == 18 && !(e.altKey && e.ctrlKey) && !e.shiftKey && e.originalEvent.repeat == false) { //alt, disable altGraph
            _this.setAltOn(true);
            $(".app-menu").addClass("alt-down");
        }

        //Close menu if open and alt is pressed
        if ((e.which == 18 && !(e.altKey && e.ctrlKey) && e.originalEvent.repeat == false) && $(".app-menu .menu-label.open").length != 0) {
            menuToggleAllowed = false;
            $(window).trigger("click");
        }



        if ($(".title-bar-replacer .menu-label.open").length > 0) {
            var target;

            var selectFirst = function() {
                if ($(".app-menu .menu-label.open .menu-item.selected").length == 0) {
                    target = $(".app-menu .menu-label.open .menu-item").first();
                    target.trigger("mouseenter");
                    target.removeClass("open");
                    return true;
                }
                return false;
            }

            target = $(".app-menu .menu-label.open .menu-item.selected").last();

            if (e.which == 38) { //arrow up
                intercept(e);
                if (selectFirst()) return;
                parent = target.parent().parent();
                target = target.prev();
                if (target.length == 0 && parent.hasClass("menu-label")) {
                    parent.removeClass("open");
                    parent.addClass("hovered");
                    _this.setAltOn(true);
                    $(".app-menu").addClass("alt-down");
                    return;
                }
                while (target.length != 0 && target.prop("nodeName") != "DIV") {
                    target = target.prev();
                }
                target.trigger("mouseenter");
                target.removeClass("open");
            }
            else if (e.which == 40) { //arrow down
                intercept(e);
                if (selectFirst()) return;
                target = target.next();
                while (target.length != 0 && target.prop("nodeName") != "DIV") {
                    target = target.next();
                }
                target.trigger("mouseenter");
                target.removeClass("open");
            }

            else if (e.which == 37) { //arrow left
                intercept(e);
                $(".app-menu .menu-item.has-sub.open").last().trigger("mouseenter");
                if (!target.parent().parent().hasClass("menu-label"))
                    target.parent().parent().removeClass("open");
                else {
                    switchCategory("left");
                    _this.setAltOn(true);
                    $(".app-menu").addClass("alt-down");
                }
            }
            else if (e.which == 39) { //arrow right
                intercept(e);
                if (!target.hasClass("has-sub")) {
                    switchCategory("right");
                    _this.setAltOn(true);
                    $(".app-menu").addClass("alt-down");
                    return;
                }

                target.addClass("open");
                target = target.find(".menu-item").first();
                target.trigger("mouseenter");
            }

            //Execute command
            else if (e.which == 13) { //enter
                intercept(e);
                target.trigger("click");
            }
            // Bounce
            else if (e.which == 32 && target && !target.hasClass("has-sub")) {
                intercept(e);
                target[0].ignoreHide = true;
                target.trigger("click");

                var duration = parseFloat(target.css("animation-duration")) * 1000;
                target.addClass("bounce");
                setTimeout(function () {
                    target.removeClass("bounce");
                }, duration);
            }
            //Close menu
            else if (e.which == 27) { //escape
                intercept(e);
                $(window).trigger("click");
            }
        }
    });

}

function intercept(event) {
    event.stopPropagation();
    event.preventDefault();
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
