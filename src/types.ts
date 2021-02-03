import { MenuItem } from "./MenuItem";
import { Submenu } from "./Submenu";

export interface IMenuItem {
    label?: string;
    command?: string;
    commandDetail?: any;
    type?: "separator";
    enabled?: boolean;
    visible?: boolean;
    submenu: IMenuItem[];
}

export interface IMenuLabel {
    label: string;
    submenu: IMenuItem[];
}

export type TMenuLike = IMenuLabel | IMenuItem;

export interface IAltKeyData {
    html: string;
    name: string;
    key: string | null;
}

export interface TbrWindowControls {
    minimize: HTMLElement;
    maximize: HTMLElement;
    close: HTMLElement;
}

export const TbrEvent = Object.freeze({
    MOUSE_CLICK: Symbol(),
    MOUSE_ENTER: Symbol(),
    MOUSE_LEAVE: Symbol(),
});

export interface MenuLike {
    getSubmenu(): Submenu | undefined;
    addChild(item: MenuItem): void;
    insertChild(item: MenuItem, index: number): void;
    removeChild(item: MenuItem): void;
    removeChild(index: number): void;
}

export interface Color {
    red: number;
    green: number;
    blue: number;
    alpha: number;
    toHexString(): string;
    toRGBAString(): string;
}

export class TbrConfig {
    displayTitleBar: boolean = false;
    displayMenuBar: boolean = false;
    openAdjacent: boolean = false;
    autoHide: boolean = false;
    hideFullscreenTitle: boolean = false;
    autoSelectColor: boolean = false;
    baseColor!: Color;
    highlightColor!: Color;
    textColor!: Color;
    titleBarStyle: string = "";
    windowControlTheme: string = "";
    reverseWindowControls: boolean = false;
}

export const titleBarStyle: { readonly [key: string]: { readonly cssId: string } } = {
    Spacious: {
        cssId: "tbr-style-spacious",
    },
    Compact: {
        cssId: "tbr-style-compact",
    },
};

export const windowControlThemes: { readonly [key: string]: { readonly cssClass: string } } = {
    "Windows 10": {
        cssClass: "control-theme-windows-10",
    },
    Arc: {
        cssClass: "control-theme-arc",
    },
    Yosemite: {
        cssClass: "control-theme-yosemite",
    },
    Legacy: {
        cssClass: "control-theme-legacy",
    },
};

export const themeCssSelectors: { readonly [key: string]: readonly string[] } = {
    base: [
        ".title-bar-replacer, .title-bar-replacer::before",
        ".app-menu .menu-label.open, .app-menu .menu-label:hover, " +
            ".app-menu .menu-label.open, .app-menu .menu-label.focused", //10% darker
        ".app-menu .menu-label .menu-box", //ligther
    ],
    hi: [
        ".app-menu .menu-label .menu-box .menu-item.open, .app-menu .menu-label .menu-box " +
            ".menu-item.selected",
    ],
    txt: [
        ".title-bar-replacer",
        ".title-bar-replacer .custom-title, .app-menu .menu-label .menu-box hr, " +
            ".app-menu .menu-label .menu-box .menu-item .menu-item-keystroke, " +
            ".app-menu .menu-label .menu-box .menu-item.disabled", //subtle
        ".tbr-title-bar i, .tbr-title-bar i.disabled, .app-menu .menu-label .menu-box " +
            ".menu-item", //highlight
    ],
};
