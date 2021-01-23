import EventEmitter from "events";
import { IMenuItem } from "./IMenuItem";
import { MalformedInputError } from "./MalformedInputError";
import { TbrEvent } from "./TbrEvent";
import { Utils } from "./Utils";

export class MenuItem {
    private element: HTMLDivElement | HTMLHRElement;
    private separator: boolean = false;
    private enabled: boolean = true;
    private visible: boolean = true;
    private selected: boolean = false;
    private open: boolean = false;
    private command?: string;
    private commandDetail?: any;
    private submenu?: MenuItem[];
    private emitter: EventEmitter;
    private parentEmitter?: EventEmitter;

    private constructor(element: HTMLDivElement | HTMLHRElement) {
        this.element = element;
        this.emitter = new EventEmitter();

        this.emitter.on(TbrEvent.MOUSE_CLICK, (...args) => this.onSubItemClick(args[0], args[1]));
        this.emitter.on(TbrEvent.MOUSE_ENTER, (...args) =>
            this.onSubItemMouseEnter(args[0], args[1])
        );

        this.element.addEventListener("click", (e) => this.onMouseClick(e as MouseEvent));
        this.element.addEventListener("mouseenter", (e) => this.onMouseEnter(e as MouseEvent));
    }

    public static createMenuItem(menuItem: IMenuItem, parentEmitter?: EventEmitter): MenuItem {
        if (menuItem.type == "separator") {
            const self = new MenuItem(document.createElement("hr"));
            self.separator = true;
            return self;
        }
        if (menuItem.label === undefined) {
            throw new MalformedInputError("Menu item is malformed!");
        }

        const elmnt = document.createElement("div");
        elmnt.classList.add("menu-item");
        const self = new MenuItem(elmnt);
        self.parentEmitter = parentEmitter;

        if (menuItem.enabled === false) {
            self.enabled = false;
            elmnt.classList.add("disabled");
        }

        if (menuItem.visible === false) {
            self.visible = false;
            elmnt.classList.add("invisible");
        }

        const altKeyData = Utils.formatAltKey(menuItem.label);
        elmnt.setAttribute("alt-trigger", altKeyData.key as string);

        // Exception for the VERSION item
        if (menuItem.label === "VERSION") {
            altKeyData.html = "Version " + atom.getVersion();
        }

        const menuItemName = document.createElement("span");
        menuItemName.classList.add("menu-item-name");
        menuItemName.innerHTML = altKeyData.html;

        const menuItemKeystroke = document.createElement("span");
        menuItemKeystroke.classList.add("menu-item-keystroke");

        elmnt.appendChild(menuItemName);
        elmnt.appendChild(menuItemKeystroke);

        if (menuItem.command !== undefined) {
            self.command = menuItem.command;
            self.commandDetail = menuItem.commandDetail;

            const keyStrokes = atom.keymaps.findKeyBindings({ command: menuItem.command });
            if (keyStrokes.length > 0) {
                menuItemKeystroke.innerHTML = keyStrokes[keyStrokes.length - 1].keystrokes;
            }
        }

        if (menuItem.submenu?.length > 0) {
            elmnt.classList.add("has-sub");

            const menuBox = document.createElement("div");
            menuBox.classList.add("menu-box", "menu-item-submenu");

            self.submenu = [];
            menuItem.submenu.forEach((o) => {
                try {
                    const listItem = MenuItem.createMenuItem(o, self.emitter);
                    self.submenu?.push(listItem);
                    menuBox.appendChild(listItem.getElement());
                } catch (e) {
                    console.error(e);
                }
            });

            elmnt.appendChild(menuBox);
        }

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

    public isSeparator() {
        return this.separator;
    }

    public isEnabled() {
        return this.enabled;
    }

    public isVisible() {
        return this.visible;
    }

    public isSelected() {
        return this.selected;
    }

    public isOpen() {
        return this.open;
    }

    public getCommand() {
        return this.command;
    }

    public getCommandDetail() {
        return this.commandDetail;
    }

    public setSelected(flag: boolean) {
        this.selected = flag;
        flag
            ? this.element.classList.add("selected")
            : this.element.classList.remove("selected", "open");
    }

    public setOpen(flag: boolean) {
        this.open = flag;
        if (!flag) {
            this.submenu?.forEach((o) => {
                o.setOpen(false);
                o.setSelected(false);
            });
        }
        flag ? this.element.classList.add("open") : this.element.classList.remove("open");
    }
}
