import TitleBarReplacerView from "./title-bar-replacer-view";
import WindowFrameRemover from "./window-frame-remover";
import { CompositeDisposable } from "atom";
const $: JQueryStatic = require("jQuery");
const jQuery = $;
const ConfigSchema = require("./configuration.js");

var __this: TitleBarReplacer;
var closeOnDispatch = true;
var packageReady = false;
var menuToggleAllowed = true;
var altOn = false;

//Missing definitions
declare global {
    interface BrowserWindow {
        isFullScreen(): boolean;
        isMaximized(): boolean;
        maximize(): void;
        unmaximize(): void;
        minimize(): void;
        on(event: string, callback: Function): void;
        close(): void;
    }
}
interface AppearanceStyles {
    [index: string]: {
        id: number;
        cssId: string;
        name: string;
    }
}
interface HoverStyles {
    [index: string]: {
        id: number;
        cssClass: string;
    }
}

export default class TitleBarReplacer {

    config = ConfigSchema.config;
    titleBarReplacerView: TitleBarReplacerView;
    windowFrameRemover: WindowFrameRemover;
    titleBarPanel: HTMLElement;
    subscriptions: EventKit.CompositeDisposable;
    openCategory: boolean = false;

    appearanceStyles: AppearanceStyles = {
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
    style: { id: number, cssId: string, name: string };
    hoverStyles: HoverStyles = {
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
    hoverStyle: { id: number, cssClass: string };

    public activate(state: any): void {
        console.log(state);
        __this = this;
        let html, currentTemplate;
        if (state.data) {
            html = state.data.html;
            currentTemplate = state.data.currentTemplate;
        }
        this.titleBarReplacerView = new TitleBarReplacerView({ html: html, template: currentTemplate, titleBarReplacer: this });
        this.titleBarPanel = this.titleBarReplacerView.getElement();
        $(".workspace").prepend(this.titleBarPanel);
        this.titleBarReplacerView.initControls();
        if (!this.titleBarReplacerView.builtFromState) this.titleBarReplacerView.spawnTemp();

        var intervalID = setInterval(function() {
            if ($("atom-pane-container.panes").css("display") == "flex") {
                clearInterval(intervalID);
                __this.initKeyListeners();
                if (!__this.titleBarReplacerView.builtFromState) __this.titleBarReplacerView.deserializeLabels();
                else if (!state.data.currentTemplate) __this.titleBarReplacerView.setCurrentTemplate(JSON.parse(JSON.stringify(atom.menu.template))); // Deep clone menu template
                __this.titleBarReplacerView.initMenuBar();
                __this.titleBarReplacerView.updateMenu();
                packageReady = true;
            }
        }, 50);

        atom.menu.update = (function(prev) {
            function extendUpdate() {
                prev.apply(atom.menu);
                if (packageReady)
                    __this.titleBarReplacerView.updateMenu();
            }

            return extendUpdate;
        })(atom.menu.update);

        this.subscriptions = new CompositeDisposable();

        // Register commands
        this.subscriptions.add(atom.commands.add('atom-workspace', {
            'title-bar-replacer:toggle-title-bar': () => this.toggleTitleBar(),
            'title-bar-replacer:toggle-menu-bar': () => this.toggleMenuBar(),
            'title-bar-replacer:restore-defaults': () => this.resetSettings(),
            'title-bar-replacer:auto-select-colours': () => this.toggleAutoColor(),
            'title-bar-replacer:remove-window-frame': () => this.runFrameRemover(),
            'title-bar-replacer:force-rebuild-title-bar': () => this.rebuildTitleBar(),
            'title-bar-replacer:run-menu-updater': () => this.titleBarReplacerView.updateMenu()
        }));

        atom.views.getView(atom.workspace).addEventListener('keyup', function(e) {
            __this.keyHandler(e);
        });

        atom.config.observe('title-bar-replacer.general.displayTitleBar', (function(__this) {
            return function(value: boolean) {
                return __this.setTitleBarVisible(value);
            };
        })(this));
        atom.config.observe('title-bar-replacer.general.displayMenuBar', (function(__this) {
            return function(value: boolean) {
                return __this.setMenuVisible(value);
            };
        })(this));
        atom.config.observe("title-bar-replacer.general.autoHide", (function(__this) {
            return function(value: boolean) {
                if (value)
                    return __this.setMenuVisible(false);

                return __this.setMenuVisible(atom.config.get("title-bar-replacer.general.displayMenuBar"));
            };
        })(this));
        atom.config.observe("title-bar-replacer.general.hideFullscreenTitle", (function(__this) {
            return function(value: boolean) {
                return __this.fullscreenTitleBar(value);
            };
        })(this));
        atom.config.onDidChange('title-bar-replacer.general.closeOnDispatch', function(value) {
            closeOnDispatch = value.newValue;
        });
        atom.config.onDidChange('title-bar-replacer.colours.autoSelectColour', function(value) {
            __this.toggleAutoColor(value.newValue);
        });
        atom.config.observe('title-bar-replacer.colours.baseColour', (function(__this) {
            return function(value: any) {
                if (!__this.isAutoColour()) __this.setCustomColours();
            };
        })(this));
        atom.config.observe('title-bar-replacer.colours.highlightColour', (function(__this) {
            return function(value: any) {
                if (!__this.isAutoColour()) __this.setCustomColours();
            };
        })(this));
        atom.config.observe('title-bar-replacer.colours.textColour', (function(__this) {
            return function(value: any) {
                if (!__this.isAutoColour()) __this.setCustomColours();
            };
        })(this));
        atom.config.observe('title-bar-replacer.colours.style', (function(__this) {
            return function(value: string) {
                __this.setTitleBarStyle(value);
            };
        })(this));
        atom.config.observe('title-bar-replacer.colours.controlTheme', (function(__this) {
            return function(value: string) {
                __this.setControlTheme(value);
            };
        })(this));
        atom.config.observe('title-bar-replacer.colours.controlLocation', (function(__this) {
            return function(value: boolean) {
                value ? $(".title-bar-replacer").addClass("reverse-controls") : $(".title-bar-replacer").removeClass("reverse-controls");
            };
        })(this));
        atom.config.onDidChange('title-bar-replacer.configuration.restoreDefaults', function(value) {
            if (value.newValue) __this.resetSettings();
        });
        atom.config.onDidChange('title-bar-replacer.configuration.removeFrame', function(value) {
            if (value.newValue) __this.runFrameRemover();
            setTimeout(function() {
                atom.config.set("title-bar-replacer.configuration.removeFrame", ConfigSchema.config.configuration.properties.removeFrame.default);
            }, 300);
        });
    }

    public deactivate(): void {
        this.subscriptions.dispose();
        this.titleBarReplacerView.destroy();
    }

    public serialize() {
        return {
            data: {
                html: this.titleBarPanel.outerHTML,
                currentTemplate: JSON.stringify(this.titleBarReplacerView.currentTemplate, function(key, value) {
                	if (key == "menuParent") return undefined;
                	return value;
                })
            }
        }
    }

    public toggleTitleBar(): boolean {
        var setTo: boolean = $(".title-bar-replacer .tbr-title-bar").hasClass("no-title-bar");
        this.setTitleBarVisible(setTo);
        atom.config.set("title-bar-replacer.general.displayTitleBar", setTo);
        return setTo;
    }

    public toggleMenuBar(): boolean {
        var setTo: boolean = !(this.titleBarPanel as any).isMenuVisible();
        this.setMenuVisible(setTo);
        atom.config.set("title-bar-replacer.general.displayMenuBar", setTo);
        return setTo;
    }

    public setTitleBarVisible(bool: boolean): void {
        if (bool)
            $(".title-bar-replacer .tbr-title-bar").removeClass("no-title-bar");
        else $(".title-bar-replacer .tbr-title-bar").addClass("no-title-bar");
    }

    public fullscreenTitleBar(bool: boolean): void {
        if (bool && (<BrowserWindow>atom.getCurrentWindow()).isFullScreen())
            $(".title-bar-replacer .tbr-title-bar").addClass("no-title-bar");
        else $(".title-bar-replacer .tbr-title-bar").removeClass("no-title-bar");
    }

    public isAutoColour(): boolean {
        return atom.config.get("title-bar-replacer.colours.autoSelectColour");
    }

    public toggleAutoColor(bool?: boolean): void {
        if (bool == undefined)
            bool = !this.isAutoColour();
        atom.config.set("title-bar-replacer.colours.autoSelectColour", bool);
        if (bool) {
            atom.notifications.addSuccess("Auto Colour component enabled");
            this.clearCustomColours();
        } else {
            atom.notifications.addInfo("Auto Colour component disabled");
            this.setCustomColours();
        }
    }

    public runFrameRemover(): void {
        if (this.windowFrameRemover == null)
            this.windowFrameRemover = new WindowFrameRemover();
        this.windowFrameRemover.run();
    }

    public rebuildTitleBar(): void {

        this.titleBarReplacerView.destroy();

        this.titleBarReplacerView = new TitleBarReplacerView({ html: undefined, template: undefined, titleBarReplacer: this });
        this.titleBarPanel = this.titleBarReplacerView.getElement();
        $(".workspace").prepend(this.titleBarPanel);
        this.titleBarReplacerView.initControls();
        this.titleBarReplacerView.deserializeLabels();
        this.titleBarReplacerView.initMenuBar();
        this.titleBarReplacerView.updateMenu();
        this.setTitleBarStyle(atom.config.get("title-bar-replacer.colours.style"), true);
        this.setControlTheme(atom.config.get("title-bar-replacer.colours.controlTheme"), true);
    }

	public setAltOn(flag: boolean): void {
		altOn = flag;
	}

    public setMenuVisible(flag: boolean): void {
        if (flag) (document.querySelector(".app-menu") as any).classList.remove("no-menu-bar");
        else (document.querySelector(".app-menu") as any).classList.add("no-menu-bar");
    }

    private isMenuVisible(): boolean {
        return !$(".app-menu").hasClass("no-menu-bar");
    }

    private keyHandler(keyEvent: KeyboardEvent): void {
        if (!packageReady) return;

        if (keyEvent.keyCode == 18 && keyEvent.ctrlKey == false && keyEvent.shiftKey == false && keyEvent.code != "AltRight") { //alt key
            if (menuToggleAllowed && atom.config.get("title-bar-replacer.general.autoHide")) {
                if ($(".app-menu .menu-label.open").length > 0){
                    this.openCategory = true;
                    $(window).click();
                }
                else {
                    this.setMenuVisible(!this.isMenuVisible());
                }
            }
            menuToggleAllowed = true;
        }
    }

    private resetSettings(): void {
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
        setTimeout(function() {
            atom.config.set("title-bar-replacer.configuration.restoreDefaults", c.configuration.properties.restoreDefaults.default);
        }, 300);
    }

    private createStyleSheet(id?: string, domClass?: string): CSSStyleSheet {
        if (id) id = id.replace("#", "");

        var style = document.createElement("style");
        style.id = id ? id : "title-bar-replacer-style";
        if (domClass) style.classList.add(domClass);
        style.appendChild(document.createTextNode(""));
        document.head.appendChild(style);

        return <CSSStyleSheet>style.sheet;
    }

    private styleExists(id?: string): boolean {
        var query = id ? id : "#title-bar-replacer-style";
        return ($(query)[0] != undefined);
    }

    private getStyleSheet(id?: string, domClass?: string): CSSStyleSheet {
        var query: string = id ? id : "#title-bar-replacer-style";

        if (!this.styleExists(query))
            return this.createStyleSheet(query, domClass);

        if (domClass) query += "." + domClass;

        return ($(query)[0] as any).sheet;
    }

    private clearRule(selector: string) {
        var sheet = this.getStyleSheet();
        for (var i = 0; i < sheet.cssRules.length; i++) {
            if ((<CSSStyleRule>sheet.cssRules[i]).selectorText == selector) {
                sheet.removeRule(i);
            }
        }
        return sheet;
    }

    private removeNodes(selector: string): void {
        (<any>document.querySelectorAll(".tbr-appearance")).forEach(function(o: HTMLElement) {
            o.remove();
        });
    }

    private clearCustomColours(): void {
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
            this.clearRule(base[i]);
        }
        this.clearRule(hi);
        for (var i = 0; i < txt.length; i++) {
            this.clearRule(txt[i]);
        }
    }

    private setCustomColours(): void {
        var sheet = this.getStyleSheet();

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

        var colourBase: string, colourHighlight: string, colourText: string;

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
    }

    private shadeColor(hexcolor: string, frac: number): string {
        var f = parseInt(hexcolor.slice(1), 16),
            t = frac < 0 ? 0 : 255,
            p = frac < 0 ? frac * -1 : frac,
            R = f >> 16,
            G = f >> 8 & 0x00FF,
            B = f & 0x0000FF;
        return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
    }

    //0.0: darkest, 1.0: lightest
    private getLuminance(hexcolor: string): number {
        if (hexcolor.includes("#")) hexcolor = hexcolor.slice(1);
        //Convert the 'RRGGBB' to their decimal values
        var r = parseInt(hexcolor.substr(0, 2), 16);
        var g = parseInt(hexcolor.substr(2, 2), 16);
        var b = parseInt(hexcolor.substr(4, 2), 16);
        //Calculate the 'y' of the YIQ colour model
        var y = (r * 299 + g * 587 + b * 114) / 1000;
        return (y / 255);
    }

    private setTitleBarStyle(style: string, force?: boolean): void {
        var id: number = this.appearanceStyles[style].id;
        if (id === undefined || (this.style && this.style.id == id && !force)) return;

        var tbr = document.querySelector(".title-bar-replacer");
        if (!tbr) return;
        if (this.style) {
            tbr.classList.remove(this.style.cssId);
        }
        this.style = this.appearanceStyles[style];
        tbr.classList.add(this.style.cssId);

        this.removeNodes(".tbr-appearance");

    }

    private setControlTheme(style: string, force?: boolean): void {

        var id: number = this.hoverStyles[style].id;
        if (id === undefined || (this.hoverStyle && id == this.hoverStyle.id && !force)) return;

        var tbr = document.querySelector(".title-bar-replacer");
        if (!tbr) return;
        if (this.hoverStyle) {
            tbr.classList.remove(this.hoverStyle.cssClass);
        }

        this.hoverStyle = this.hoverStyles[style];
        tbr.classList.add(this.hoverStyle.cssClass);

    }


    private intercept(event: Event | JQuery.Event): void {
        event.stopPropagation();
        event.preventDefault();
    }

    private initKeyListeners(): void {

        var switchCategory = function(direction: string) {

            var target = $(".app-menu .menu-label.hovered, .app-menu .menu-label.open");

            var focusCategory = function(): boolean {
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
                __this.titleBarReplacerView.hideAll();
                target.addClass("hovered");
            }

        }

        //Keyboard navigation
        $("atom-workspace").keydown(function(e: JQuery.Event) {

            if (altOn && $(".app-menu .menu-label.open").length == 0) {

                if (e.which == 39) { //arrow right
                    __this.intercept(e);
                    switchCategory("right");
                }
                else if (e.which == 37) { //arrow left
                    __this.intercept(e);
                    switchCategory("left");
                }
                else if (e.which == 27) { //escape
                    __this.intercept(e);
                    $(window).trigger("click");
                }
            }

            //Alt shortcuts
            if (altOn && (<KeyboardEvent>e.originalEvent).repeat == false) {
                if (e.which == 18 && !(e.altKey && e.ctrlKey)) {
                    menuToggleAllowed = false;
                    $(window).trigger("click");
                    return;
                }

                var key = (e.key as string).toLowerCase();
                var targets;

                if ($(".app-menu .menu-label.open").length == 0) {
                    targets = $(".app-menu .menu-label");
                } else {
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

                var target: JQuery<HTMLElement> = $(".app-menu .menu-label.hovered");
                if ((e.which == 32 || e.which == 13 || e.which == 40) && target.length > 0) { //space || enter || arrow down
                    target.trigger("click");
                    __this.titleBarReplacerView.cleanHovered();
                }
                // Disable alt mode if no command was dispatched and the pressed key was irrelevant
                else if (!dispatched && e.which != 37 && e.which != 38 && e.which != 39 && e.which != 40
                        && e.which != 32 && e.which != 13 && e.which != 27 && e.which != 18) {// arrow left | arrow up | arrow right | arrow down | space | enter | escape | alt
                    $(window).trigger("click");
                    menuToggleAllowed = false;
                }
            }
            else if (e.which == 18 && !(e.altKey && e.ctrlKey) && !e.shiftKey && (<KeyboardEvent>e.originalEvent).repeat == false) { //alt, disable altGraph
                __this.setAltOn(true);
                $(".app-menu").addClass("alt-down");
            }

            //Close menu if open and alt is pressed
            if ((e.which == 18 && !(e.altKey && e.ctrlKey) && (<KeyboardEvent>e.originalEvent).repeat == false) && $(".app-menu .menu-label.open").length != 0) {
                menuToggleAllowed = false;
                $(window).trigger("click");
            }



            if ($(".title-bar-replacer .menu-label.open").length > 0) {
                var target: JQuery<HTMLElement>;

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
                    __this.intercept(e);
                    if (selectFirst()) return;
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
                else if (e.which == 40) { //arrow down
                    __this.intercept(e);
                    if (selectFirst()) return;
                    target = target.next();
                    while (target.length != 0 && target.prop("nodeName") != "DIV") {
                        target = target.next();
                    }
                    target.trigger("mouseenter");
                    target.removeClass("open");
                }

                else if (e.which == 37) { //arrow left
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
                else if (e.which == 39) { //arrow right
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

                //Execute command
                else if (e.which == 13) { //enter
                    __this.intercept(e);
                    target.trigger("click");
                }
                // Bounce
                else if (e.which == 32 && target && !target.hasClass("has-sub")) {
                    __this.intercept(e);
                    (target[0] as any).ignoreHide = true;
                    target.trigger("click");

                    var duration = parseFloat(target.css("animation-duration")) * 1000;
                    target.addClass("bounce");
                    setTimeout(function () {
                        target.removeClass("bounce");
                    }, duration);
                }
                //Close menu
                else if (e.which == 27) { //escape
                    __this.intercept(e);
                    $(window).trigger("click");
                }
            }
        });

    }

}
