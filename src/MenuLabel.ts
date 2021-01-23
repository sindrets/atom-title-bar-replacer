import { IMenuLabel } from "./IMenuLabel";
import { MalformedInputError } from "./MalformedInputError";
import { MenuItem } from "./MenuItem";
import { Utils } from "./Utils";
import { TbrEvent } from "./TbrEvent";
import EventEmitter from "events";

export class MenuLabel {
    private element: HTMLSpanElement;
    private submenu: MenuItem[];
    private open: boolean = false;
    private emitter?: EventEmitter;
    private parentEmitter?: EventEmitter;

    private constructor(element: HTMLSpanElement) {
        this.element = element;
        this.submenu = [];
        this.emitter = new EventEmitter();

        this.emitter.on(TbrEvent.MOUSE_CLICK, (...args) => this.onSubItemClick(args[0], args[1]));
        this.emitter.on(TbrEvent.MOUSE_ENTER, (...args) =>
            this.onSubItemMouseEnter(args[0], args[1])
        );

        this.element.addEventListener("click", (e) => this.onMouseClick(e));
        this.element.addEventListener("mouseenter", (e) => this.onMouseEnter(e));
    }

    public static createMenuLabel(labelItem: IMenuLabel, parentEmitter?: EventEmitter): MenuLabel {
        if (labelItem.label === undefined || !labelItem.submenu) {
            throw new MalformedInputError("Label object is malformed!");
        }

        const elmnt = document.createElement("span");
        elmnt.classList.add("menu-label");
        const labelData = Utils.formatAltKey(labelItem.label);
        elmnt.setAttribute("label", labelData.name);
        elmnt.setAttribute("alt-trigger", labelData.key as string);
        elmnt.innerHTML = labelData.html;

        const self = new MenuLabel(elmnt);

        const submenuElmnt = document.createElement("div");
        submenuElmnt.classList.add("menu-box");
        elmnt.appendChild(submenuElmnt);

        const submenu: MenuItem[] = [];
        labelItem.submenu.forEach((o) => {
            try {
                const menuItem = MenuItem.createMenuItem(o, self.emitter);
                submenu.push(menuItem);
                submenuElmnt.appendChild(menuItem.getElement());
            } catch (e) {
                console.error(e);
            }
        });

        self.submenu = submenu;
        self.parentEmitter = parentEmitter;

        return self;
    }

    private onMouseClick(e: MouseEvent) {
        e.stopPropagation();
        this.parentEmitter?.emit(TbrEvent.MOUSE_CLICK, this, e);
    }

    private onMouseEnter(e: MouseEvent) {
        e.stopPropagation();
        this.parentEmitter?.emit(TbrEvent.MOUSE_ENTER, this, e);
    }

    private onSubItemClick(target: MenuItem, e: MouseEvent): void {}

    private onSubItemMouseEnter(target: MenuItem, e: MouseEvent): void {
        this.submenu?.forEach((o) => {
            o.setOpen(false);
            o.setSelected(false);
        });
        target.setSelected(true);
        target.setOpen(true);
    }

    public getElement() {
        return this.element;
    }

    public getSubmenu() {
        return this.submenu;
    }

    public isOpen() {
        return this.open;
    }

    public setOpen(flag: boolean) {
        this.open = flag;
        this.submenu.forEach((o) => {
            o.setOpen(false);
            if (!flag) o.setSelected(false);
        });
        flag ? this.element.classList.add("open") : this.element.classList.remove("open");
    }
}
