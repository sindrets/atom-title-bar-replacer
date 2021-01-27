import { MenuItem } from "./MenuItem";
import {Submenu} from "./Submenu";

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

export interface IAltKeyData {
    html: string;
    name: string;
    key: string | null;
}

export const TbrEvent = Object.freeze({
    MOUSE_CLICK: Symbol(),
    MOUSE_ENTER: Symbol(),
    MOUSE_LEAVE: Symbol(),
});

export interface MenuLike {
    getSubmenu(): Submenu | undefined;
    addChild(item: MenuItem): void;
}

