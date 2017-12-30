"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var title_bar_replacer_view_1 = require("./title-bar-replacer-view");
var window_frame_remover_1 = require("./window-frame-remover");
var atom_1 = require("atom");
var $ = require("jQuery");
var jQuery = $;
var ConfigSchema = require("./configuration.js");
var __this;
var closeOnDispatch = true;
var packageReady = false;
var menuToggleAllowed = true;
var altOn = false;
var TitleBarReplacer = /** @class */ (function () {
    function TitleBarReplacer() {
        this.config = ConfigSchema.config;
        this.openCategory = false;
        this.appearanceStyles = {
            "Spacious": {
                id: 0,
                cssId: "tbr-style-spacious",
                name: "Spacious"
            },
            "Compact": {
                id: 1,
                cssId: "tbr-style-compact",
                name: "Compact"
            }
        };
        this.hoverStyles = {
            "Windows 10": {
                id: 0,
                cssClass: "control-theme-windows-10"
            },
            "Arc Theme": {
                id: 1,
                cssClass: "control-theme-arc-theme"
            },
            "Yosemite": {
                id: 2,
                cssClass: "control-theme-yosemite"
            },
            "Legacy Theme": {
                id: 3,
                cssClass: "control-theme-legacy-theme"
            }
        };
    }
    TitleBarReplacer.prototype.activate = function (state) {
        var _this = this;
        console.log(state);
        __this = this;
        var html, currentTemplate;
        if (state.data) {
            html = state.data.html;
            currentTemplate = state.data.currentTemplate;
        }
        this.titleBarReplacerView = new title_bar_replacer_view_1.default({ html: html, template: currentTemplate, titleBarReplacer: this });
        this.titleBarPanel = this.titleBarReplacerView.getElement();
        $(".workspace").prepend(this.titleBarPanel);
        this.titleBarReplacerView.initControls();
        if (!this.titleBarReplacerView.builtFromState)
            this.titleBarReplacerView.spawnTemp();
        var intervalID = setInterval(function () {
            if ($("atom-pane-container.panes").css("display") == "flex") {
                clearInterval(intervalID);
                __this.initKeyListeners();
                if (!__this.titleBarReplacerView.builtFromState)
                    __this.titleBarReplacerView.deserializeLabels();
                else if (!state.data.currentTemplate)
                    __this.titleBarReplacerView.setCurrentTemplate(JSON.parse(JSON.stringify(atom.menu.template))); // Deep clone menu template
                __this.titleBarReplacerView.initMenuBar();
                __this.titleBarReplacerView.updateMenu();
                packageReady = true;
            }
        }, 50);
        atom.menu.update = (function (prev) {
            function extendUpdate() {
                prev.apply(atom.menu);
                if (packageReady)
                    __this.titleBarReplacerView.updateMenu();
            }
            return extendUpdate;
        })(atom.menu.update);
        this.subscriptions = new atom_1.CompositeDisposable();
        // Register commands
        this.subscriptions.add(atom.commands.add('atom-workspace', {
            'title-bar-replacer:toggle-title-bar': function () { return _this.toggleTitleBar(); },
            'title-bar-replacer:toggle-menu-bar': function () { return _this.toggleMenuBar(); },
            'title-bar-replacer:restore-defaults': function () { return _this.resetSettings(); },
            'title-bar-replacer:auto-select-colours': function () { return _this.toggleAutoColor(); },
            'title-bar-replacer:remove-window-frame': function () { return _this.runFrameRemover(); },
            'title-bar-replacer:force-rebuild-title-bar': function () { return _this.rebuildTitleBar(); },
            'title-bar-replacer:run-menu-updater': function () { return _this.titleBarReplacerView.updateMenu(); }
        }));
        atom.views.getView(atom.workspace).addEventListener('keyup', function (e) {
            __this.keyHandler(e);
        });
        atom.config.observe('title-bar-replacer.general.displayTitleBar', (function (__this) {
            return function (value) {
                return __this.setTitleBarVisible(value);
            };
        })(this));
        atom.config.observe('title-bar-replacer.general.displayMenuBar', (function (__this) {
            return function (value) {
                return __this.setMenuVisible(value);
            };
        })(this));
        atom.config.observe("title-bar-replacer.general.autoHide", (function (__this) {
            return function (value) {
                if (value)
                    return __this.setMenuVisible(false);
                return __this.setMenuVisible(atom.config.get("title-bar-replacer.general.displayMenuBar"));
            };
        })(this));
        atom.config.observe("title-bar-replacer.general.hideFullscreenTitle", (function (__this) {
            return function (value) {
                return __this.fullscreenTitleBar(value);
            };
        })(this));
        atom.config.onDidChange('title-bar-replacer.general.closeOnDispatch', function (value) {
            closeOnDispatch = value.newValue;
        });
        atom.config.onDidChange('title-bar-replacer.colours.autoSelectColour', function (value) {
            __this.toggleAutoColor(value.newValue);
        });
        atom.config.observe('title-bar-replacer.colours.baseColour', (function (__this) {
            return function (value) {
                if (!__this.isAutoColour())
                    __this.setCustomColours();
            };
        })(this));
        atom.config.observe('title-bar-replacer.colours.highlightColour', (function (__this) {
            return function (value) {
                if (!__this.isAutoColour())
                    __this.setCustomColours();
            };
        })(this));
        atom.config.observe('title-bar-replacer.colours.textColour', (function (__this) {
            return function (value) {
                if (!__this.isAutoColour())
                    __this.setCustomColours();
            };
        })(this));
        atom.config.observe('title-bar-replacer.colours.style', (function (__this) {
            return function (value) {
                __this.setTitleBarStyle(value);
            };
        })(this));
        atom.config.observe('title-bar-replacer.colours.controlTheme', (function (__this) {
            return function (value) {
                __this.setControlTheme(value);
            };
        })(this));
        atom.config.observe('title-bar-replacer.colours.controlLocation', (function (__this) {
            return function (value) {
                value ? $(".title-bar-replacer").addClass("reverse-controls") : $(".title-bar-replacer").removeClass("reverse-controls");
            };
        })(this));
        atom.config.onDidChange('title-bar-replacer.configuration.restoreDefaults', function (value) {
            if (value.newValue)
                __this.resetSettings();
        });
        atom.config.onDidChange('title-bar-replacer.configuration.removeFrame', function (value) {
            if (value.newValue)
                __this.runFrameRemover();
            setTimeout(function () {
                atom.config.set("title-bar-replacer.configuration.removeFrame", ConfigSchema.config.configuration.properties.removeFrame.default);
            }, 300);
        });
    };
    TitleBarReplacer.prototype.deactivate = function () {
        this.subscriptions.dispose();
        this.titleBarReplacerView.destroy();
    };
    TitleBarReplacer.prototype.serialize = function () {
        return {
            data: {
                html: this.titleBarPanel.outerHTML,
                currentTemplate: JSON.stringify(this.titleBarReplacerView.currentTemplate, function (key, value) {
                    if (key == "menuParent")
                        return undefined;
                    return value;
                })
            }
        };
    };
    TitleBarReplacer.prototype.toggleTitleBar = function () {
        var setTo = $(".title-bar-replacer .tbr-title-bar").hasClass("no-title-bar");
        this.setTitleBarVisible(setTo);
        atom.config.set("title-bar-replacer.general.displayTitleBar", setTo);
        return setTo;
    };
    TitleBarReplacer.prototype.toggleMenuBar = function () {
        var setTo = !this.titleBarPanel.isMenuVisible();
        this.setMenuVisible(setTo);
        atom.config.set("title-bar-replacer.general.displayMenuBar", setTo);
        return setTo;
    };
    TitleBarReplacer.prototype.setTitleBarVisible = function (bool) {
        if (bool)
            $(".title-bar-replacer .tbr-title-bar").removeClass("no-title-bar");
        else
            $(".title-bar-replacer .tbr-title-bar").addClass("no-title-bar");
    };
    TitleBarReplacer.prototype.fullscreenTitleBar = function (bool) {
        if (bool && atom.getCurrentWindow().isFullScreen())
            $(".title-bar-replacer .tbr-title-bar").addClass("no-title-bar");
        else
            $(".title-bar-replacer .tbr-title-bar").removeClass("no-title-bar");
    };
    TitleBarReplacer.prototype.isAutoColour = function () {
        return atom.config.get("title-bar-replacer.colours.autoSelectColour");
    };
    TitleBarReplacer.prototype.toggleAutoColor = function (bool) {
        if (bool == undefined)
            bool = !this.isAutoColour();
        atom.config.set("title-bar-replacer.colours.autoSelectColour", bool);
        if (bool) {
            atom.notifications.addSuccess("Auto Colour component enabled");
            this.clearCustomColours();
        }
        else {
            atom.notifications.addInfo("Auto Colour component disabled");
            this.setCustomColours();
        }
    };
    TitleBarReplacer.prototype.runFrameRemover = function () {
        if (this.windowFrameRemover == null)
            this.windowFrameRemover = new window_frame_remover_1.default();
        this.windowFrameRemover.run();
    };
    TitleBarReplacer.prototype.rebuildTitleBar = function () {
        this.titleBarReplacerView.destroy();
        this.titleBarReplacerView = new title_bar_replacer_view_1.default({ html: undefined, template: undefined, titleBarReplacer: this });
        this.titleBarPanel = this.titleBarReplacerView.getElement();
        $(".workspace").prepend(this.titleBarPanel);
        this.titleBarReplacerView.initControls();
        this.titleBarReplacerView.deserializeLabels();
        this.titleBarReplacerView.initMenuBar();
        this.titleBarReplacerView.updateMenu();
        this.setTitleBarStyle(atom.config.get("title-bar-replacer.colours.style"), true);
        this.setControlTheme(atom.config.get("title-bar-replacer.colours.controlTheme"), true);
    };
    TitleBarReplacer.prototype.setAltOn = function (flag) {
        altOn = flag;
    };
    TitleBarReplacer.prototype.setMenuVisible = function (flag) {
        if (flag)
            document.querySelector(".app-menu").classList.remove("no-menu-bar");
        else
            document.querySelector(".app-menu").classList.add("no-menu-bar");
    };
    TitleBarReplacer.prototype.isMenuVisible = function () {
        return !$(".app-menu").hasClass("no-menu-bar");
    };
    TitleBarReplacer.prototype.keyHandler = function (keyEvent) {
        if (!packageReady)
            return;
        if (keyEvent.keyCode == 18 && keyEvent.ctrlKey == false && keyEvent.shiftKey == false && keyEvent.code != "AltRight") {
            if (menuToggleAllowed && atom.config.get("title-bar-replacer.general.autoHide")) {
                if ($(".app-menu .menu-label.open").length > 0) {
                    this.openCategory = true;
                    $(window).click();
                }
                else {
                    this.setMenuVisible(!this.isMenuVisible());
                }
            }
            menuToggleAllowed = true;
        }
    };
    TitleBarReplacer.prototype.resetSettings = function () {
        var c = this.config;
        atom.config.set("title-bar-replacer.general.displayTitleBar", c.general.properties.displayTitleBar.default);
        atom.config.set("title-bar-replacer.general.displayMenuBar", c.general.properties.displayMenuBar.default);
        atom.config.set("title-bar-replacer.general.closeOnDispatch", c.general.properties.closeOnDispatch.default);
        atom.config.set("title-bar-replacer.general.openAdjacent", c.general.properties.openAdjacent.default);
        atom.config.set("title-bar-replacer.general.autoHide", c.general.properties.autoHide.default);
        atom.config.set("title-bar-replacer.general.hideFullscreenTitle", c.general.properties.hideFullscreenTitle.default);
        atom.config.set("title-bar-replacer.colours.autoSelectColour", c.colours.properties.autoSelectColour.default);
        atom.config.set("title-bar-replacer.colours.baseColour", c.colours.properties.baseColour.default);
        atom.config.set("title-bar-replacer.colours.highlightColour", c.colours.properties.highlightColour.default);
        atom.config.set("title-bar-replacer.colours.textColour", c.colours.properties.textColour.default);
        atom.config.set("title-bar-replacer.colours.style", c.colours.properties.style.default);
        atom.config.set("title-bar-replacer.colours.controlTheme", c.colours.properties.controlTheme.default);
        setTimeout(function () {
            atom.config.set("title-bar-replacer.configuration.restoreDefaults", c.configuration.properties.restoreDefaults.default);
        }, 300);
    };
    TitleBarReplacer.prototype.createStyleSheet = function (id, domClass) {
        if (id)
            id = id.replace("#", "");
        var style = document.createElement("style");
        style.id = id ? id : "title-bar-replacer-style";
        if (domClass)
            style.classList.add(domClass);
        style.appendChild(document.createTextNode(""));
        document.head.appendChild(style);
        return style.sheet;
    };
    TitleBarReplacer.prototype.styleExists = function (id) {
        var query = id ? id : "#title-bar-replacer-style";
        return ($(query)[0] != undefined);
    };
    TitleBarReplacer.prototype.getStyleSheet = function (id, domClass) {
        var query = id ? id : "#title-bar-replacer-style";
        if (!this.styleExists(query))
            return this.createStyleSheet(query, domClass);
        if (domClass)
            query += "." + domClass;
        return $(query)[0].sheet;
    };
    TitleBarReplacer.prototype.clearRule = function (selector) {
        var sheet = this.getStyleSheet();
        for (var i = 0; i < sheet.cssRules.length; i++) {
            if (sheet.cssRules[i].selectorText == selector) {
                sheet.removeRule(i);
            }
        }
        return sheet;
    };
    TitleBarReplacer.prototype.removeNodes = function (selector) {
        document.querySelectorAll(".tbr-appearance").forEach(function (o) {
            o.remove();
        });
    };
    TitleBarReplacer.prototype.clearCustomColours = function () {
        var base = [
            ".title-bar-replacer",
            ".app-menu .menu-label.open, .app-menu .menu-label:hover",
            ".app-menu .menu-label .menu-box" //ligther
        ];
        var hi = ".app-menu .menu-label .menu-box .menu-item.open, .app-menu .menu-label .menu-box .menu-item:hover";
        var txt = [
            ".title-bar-replacer",
            ".title-bar-replacer .custom-title, .app-menu .menu-label .menu-box hr, .app-menu .menu-label .menu-box .menu-item .menu-item-keystroke",
            ".tbr-title-bar i, .tbr-title-bar i.disabled, .app-menu .menu-label .menu-box .menu-item" //highlight
        ];
        for (var i = 0; i < base.length; i++) {
            this.clearRule(base[i]);
        }
        this.clearRule(hi);
        for (var i = 0; i < txt.length; i++) {
            this.clearRule(txt[i]);
        }
    };
    TitleBarReplacer.prototype.setCustomColours = function () {
        var sheet = this.getStyleSheet();
        var base = [
            ".title-bar-replacer",
            ".app-menu .menu-label.open, .app-menu .menu-label:hover",
            ".app-menu .menu-label .menu-box" //ligther
        ];
        var hi = ".app-menu .menu-label .menu-box .menu-item.open, .app-menu .menu-label .menu-box .menu-item:hover";
        var txt = [
            ".title-bar-replacer",
            ".title-bar-replacer .custom-title, .app-menu .menu-label .menu-box hr, .app-menu .menu-label .menu-box .menu-item .menu-item-keystroke",
            ".tbr-title-bar i, .tbr-title-bar i.disabled, .app-menu .menu-label .menu-box .menu-item" //highlight
        ];
        var colourBase, colourHighlight, colourText;
        colourBase = atom.config.get("title-bar-replacer.colours.baseColour").toHexString();
        colourHighlight = atom.config.get("title-bar-replacer.colours.highlightColour").toHexString();
        colourText = atom.config.get("title-bar-replacer.colours.textColour").toHexString();
        for (var i = 0; i < base.length; i++) {
            this.clearRule(base[i]);
        }
        this.clearRule(hi);
        for (var i = 0; i < txt.length; i++) {
            this.clearRule(txt[i]);
        }
        var factor = (this.getLuminance(colourBase) >= 0.5 ? -1 : 1);
        sheet.insertRule(base[0] + "{ background-color: " + colourBase + " !important }", sheet.cssRules.length);
        sheet.insertRule(base[1] + "{ background-color: " + this.shadeColor(colourBase, (-0.4) * factor) + " !important }", sheet.cssRules.length);
        sheet.insertRule(base[2] + "{ background-color: " + this.shadeColor(colourBase, (0.1) * factor) + " !important }", sheet.cssRules.length);
        sheet.insertRule(hi + "{ background-color: " + colourHighlight + " !important }", sheet.cssRules.length);
        factor = (this.getLuminance(colourText) >= 0.5 ? -1 : 1);
        sheet.insertRule(txt[0] + "{ color: " + colourText + " !important }", sheet.cssRules.length);
        sheet.insertRule(txt[1] + "{ color: " + this.shadeColor(colourText, (0.25) * factor) + " !important }", sheet.cssRules.length);
        sheet.insertRule(txt[2] + "{ color: " + this.shadeColor(colourText, (-0.4) * factor) + " !important }", sheet.cssRules.length);
    };
    TitleBarReplacer.prototype.shadeColor = function (hexcolor, frac) {
        var f = parseInt(hexcolor.slice(1), 16), t = frac < 0 ? 0 : 255, p = frac < 0 ? frac * -1 : frac, R = f >> 16, G = f >> 8 & 0x00FF, B = f & 0x0000FF;
        return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
    };
    //0.0: darkest, 1.0: lightest
    TitleBarReplacer.prototype.getLuminance = function (hexcolor) {
        if (hexcolor.includes("#"))
            hexcolor = hexcolor.slice(1);
        //Convert the 'RRGGBB' to their decimal values
        var r = parseInt(hexcolor.substr(0, 2), 16);
        var g = parseInt(hexcolor.substr(2, 2), 16);
        var b = parseInt(hexcolor.substr(4, 2), 16);
        //Calculate the 'y' of the YIQ colour model
        var y = (r * 299 + g * 587 + b * 114) / 1000;
        return (y / 255);
    };
    TitleBarReplacer.prototype.setTitleBarStyle = function (style, force) {
        var id = this.appearanceStyles[style].id;
        if (id === undefined || (this.style && this.style.id == id && !force))
            return;
        var tbr = document.querySelector(".title-bar-replacer");
        if (!tbr)
            return;
        if (this.style) {
            tbr.classList.remove(this.style.cssId);
        }
        this.style = this.appearanceStyles[style];
        tbr.classList.add(this.style.cssId);
        this.removeNodes(".tbr-appearance");
    };
    TitleBarReplacer.prototype.setControlTheme = function (style, force) {
        var id = this.hoverStyles[style].id;
        if (id === undefined || (this.hoverStyle && id == this.hoverStyle.id && !force))
            return;
        var tbr = document.querySelector(".title-bar-replacer");
        if (!tbr)
            return;
        if (this.hoverStyle) {
            tbr.classList.remove(this.hoverStyle.cssClass);
        }
        this.hoverStyle = this.hoverStyles[style];
        tbr.classList.add(this.hoverStyle.cssClass);
    };
    TitleBarReplacer.prototype.intercept = function (event) {
        event.stopPropagation();
        event.preventDefault();
    };
    TitleBarReplacer.prototype.initKeyListeners = function () {
        var switchCategory = function (direction) {
            var target = $(".app-menu .menu-label.hovered, .app-menu .menu-label.open");
            var focusCategory = function () {
                if (target.length == 0) {
                    switch (direction) {
                        case "right":
                            $(".app-menu .menu-label").first().addClass("hovered");
                            break;
                        case "left":
                            $(".app-menu .menu-label").last().addClass("hovered");
                    }
                    return true;
                }
                return false;
            };
            if (!focusCategory()) {
                switch (direction) {
                    case "right":
                        target = target.next();
                        break;
                    case "left":
                        target = target.prev();
                }
                __this.titleBarReplacerView.hideAll();
                target.addClass("hovered");
            }
        };
        //Keyboard navigation
        $("atom-workspace").keydown(function (e) {
            if (altOn && $(".app-menu .menu-label.open").length == 0) {
                if (e.which == 39) {
                    __this.intercept(e);
                    switchCategory("right");
                }
                else if (e.which == 37) {
                    __this.intercept(e);
                    switchCategory("left");
                }
                else if (e.which == 27) {
                    __this.intercept(e);
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
                }
                else {
                    targets = $(".app-menu span.open > .menu-box, .app-menu div.open > .menu-box").last().children();
                }
                var dispatched = false;
                for (var i = 0; i < targets.length; i++) {
                    if (targets[i].getAttribute("alt-trigger") == key) {
                        dispatched = true;
                        $(targets[i]).trigger("click");
                        break;
                    }
                }
                if (dispatched) {
                    __this.intercept(e);
                    return;
                }
                var target = $(".app-menu .menu-label.hovered");
                if ((e.which == 32 || e.which == 13 || e.which == 40) && target.length > 0) {
                    target.trigger("click");
                    __this.titleBarReplacerView.cleanHovered();
                }
                else if (!dispatched && e.which != 37 && e.which != 38 && e.which != 39 && e.which != 40
                    && e.which != 32 && e.which != 13 && e.which != 27 && e.which != 18) {
                    $(window).trigger("click");
                    menuToggleAllowed = false;
                }
            }
            else if (e.which == 18 && !(e.altKey && e.ctrlKey) && !e.shiftKey && e.originalEvent.repeat == false) {
                __this.setAltOn(true);
                $(".app-menu").addClass("alt-down");
            }
            //Close menu if open and alt is pressed
            if ((e.which == 18 && !(e.altKey && e.ctrlKey) && e.originalEvent.repeat == false) && $(".app-menu .menu-label.open").length != 0) {
                menuToggleAllowed = false;
                $(window).trigger("click");
            }
            if ($(".title-bar-replacer .menu-label.open").length > 0) {
                var target;
                var selectFirst = function () {
                    if ($(".app-menu .menu-label.open .menu-item.selected").length == 0) {
                        target = $(".app-menu .menu-label.open .menu-item").first();
                        target.trigger("mouseenter");
                        target.removeClass("open");
                        return true;
                    }
                    return false;
                };
                target = $(".app-menu .menu-label.open .menu-item.selected").last();
                if (e.which == 38) {
                    __this.intercept(e);
                    if (selectFirst())
                        return;
                    var parent = target.parent().parent();
                    target = target.prev();
                    if (target.length == 0 && parent.hasClass("menu-label")) {
                        parent.removeClass("open");
                        parent.addClass("hovered");
                        __this.setAltOn(true);
                        $(".app-menu").addClass("alt-down");
                        return;
                    }
                    while (target.length != 0 && target.prop("nodeName") != "DIV") {
                        target = target.prev();
                    }
                    target.trigger("mouseenter");
                    target.removeClass("open");
                }
                else if (e.which == 40) {
                    __this.intercept(e);
                    if (selectFirst())
                        return;
                    target = target.next();
                    while (target.length != 0 && target.prop("nodeName") != "DIV") {
                        target = target.next();
                    }
                    target.trigger("mouseenter");
                    target.removeClass("open");
                }
                else if (e.which == 37) {
                    __this.intercept(e);
                    $(".app-menu .menu-item.has-sub.open").last().trigger("mouseenter");
                    if (!target.parent().parent().hasClass("menu-label"))
                        target.parent().parent().removeClass("open");
                    else {
                        switchCategory("left");
                        __this.setAltOn(true);
                        $(".app-menu").addClass("alt-down");
                    }
                }
                else if (e.which == 39) {
                    __this.intercept(e);
                    if (!target.hasClass("has-sub")) {
                        switchCategory("right");
                        __this.setAltOn(true);
                        $(".app-menu").addClass("alt-down");
                        return;
                    }
                    target.addClass("open");
                    target = target.find(".menu-item").first();
                    target.trigger("mouseenter");
                }
                else if (e.which == 13) {
                    __this.intercept(e);
                    target.trigger("click");
                }
                else if (e.which == 32 && target && !target.hasClass("has-sub")) {
                    __this.intercept(e);
                    target[0].ignoreHide = true;
                    target.trigger("click");
                    var duration = parseFloat(target.css("animation-duration")) * 1000;
                    target.addClass("bounce");
                    setTimeout(function () {
                        target.removeClass("bounce");
                    }, duration);
                }
                else if (e.which == 27) {
                    __this.intercept(e);
                    $(window).trigger("click");
                }
            }
        });
    };
    return TitleBarReplacer;
}());
exports.default = TitleBarReplacer;
