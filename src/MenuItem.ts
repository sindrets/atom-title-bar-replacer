import EventEmitter from "events";
import { ApplicationMenu } from "./ApplicationMenu";
import { MalformedTemplateError } from "./MalformedTemplateError";
import { MenuLabel } from "./MenuLabel";
import { exceptionCommands, IMenuItem, MenuLike, TbrEvent } from "./types";
import { Utils } from "./Utils";
import { Submenu } from "./Submenu";
// @ts-ignore
import { shell } from "electron";

export class MenuItem implements MenuLike {
    private element: HTMLDivElement | HTMLHRElement;
    private labelText?: string;
    private separator: boolean = false;
    private enabled: boolean = true;
    private visible: boolean = true;
    private selected: boolean = false;
    private open: boolean = false;
    private command?: string;
    private commandDetail?: any;
    private altTrigger?: string;
    private submenu?: Submenu;
    private emitter: EventEmitter;
    private parent?: MenuLabel | MenuItem;

    private constructor(element: HTMLDivElement | HTMLHRElement) {
        this.element = element;
        this.emitter = new EventEmitter();

        this.emitter.on(TbrEvent.MOUSE_ENTER, (...args) =>
            this.onSubItemMouseEnter(args[0], args[1])
        );

        this.element.addEventListener("click", (e) => this.onMouseClick(e as MouseEvent));
        this.element.addEventListener("mouseenter", (e) => this.onMouseEnter(e as MouseEvent));
    }

    /**
     * @throws {MalformedTemplateError}
     */
    public static createMenuItem(menuItem: IMenuItem): MenuItem {
        if (menuItem.type == "separator") {
            const self = new MenuItem(document.createElement("hr"));
            self.separator = true;
            return self;
        }
        if (menuItem.label === undefined) {
            throw new MalformedTemplateError("Menu item template is malformed!");
        }

        const elmnt = document.createElement("div");
        elmnt.classList.add("menu-item");
        const self = new MenuItem(elmnt);

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
        self.altTrigger = altKeyData.key || undefined;

        // Exception for the VERSION item
        if (menuItem.label === "VERSION") {
            altKeyData.html = "Version " + atom.getVersion();
        }

        const menuItemName = document.createElement("span");
        menuItemName.classList.add("menu-item-name");
        menuItemName.innerHTML = altKeyData.html;
        self.labelText = menuItem.label;

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
            menuItem.submenu.forEach((o) => {
                try {
                    self.addChild(MenuItem.createMenuItem(o));
                } catch (e) {
                    console.error(e);
                }
            });
        }

        return self;
    }

    public serialize() {
        return {
            label: this.labelText,
            command: this.command,
            commandDetail: this.commandDetail,
            submenu: this.submenu?.map((o) => {
                return o.serialize();
            }),
        };
    }

    private onMouseClick(e: MouseEvent) {
        e.stopPropagation();
        this.parent?.getEmitter().emit(TbrEvent.MOUSE_CLICK, this, e);
        if (this.isExecutable()) {
            this.execCommand();
            this.getAppMenuRoot()?.close();
        }
    }

    private onMouseEnter(e: MouseEvent) {
        e.stopPropagation();
        this.parent?.getEmitter().emit(TbrEvent.MOUSE_ENTER, this, e);
    }

    private onSubItemMouseEnter(target: MenuItem, e: MouseEvent): void {
        this.submenu?.forEach((o) => {
            o.setOpen(false);
            o.setSelected(false);
        });
        target.setSelected(true);
        target.setOpen(true);
    }

    public async execCommand(): Promise<void> {
        if (this.command === undefined) {
            return;
        }

        if (exceptionCommands.indexOf(this.command) > -1) {
            switch (this.command) {
                case "application:open-terms-of-use":
                    shell.openExternal("https://help.github.com/articles/github-terms-of-service/");
                    break;
                case "application:open-documentation":
                    shell.openExternal("http://flight-manual.atom.io/");
                    break;
                case "application:open-faq":
                    shell.openExternal("https://atom.io/faq");
                    break;
                case "application:open-discussions":
                    shell.openExternal("https://discuss.atom.io/");
                    break;
                case "application:report-issue":
                    shell.openExternal(
                        "https://github.com/atom/atom/blob/master/CONTRIBUTING.md#submitting-issues"
                    );
                    break;
                case "application:search-issues":
                    shell.openExternal("https://github.com/atom/atom/issues");
                    break;
            }
            return;
        }

        let target =
            (atom.workspace.getActiveTextEditor() as any)?.getElement() ||
            (atom.workspace.getActivePane() as any).getElement();

        await (atom.commands as any).dispatch(target, this.command, this.commandDetail);
    }

    public addChild(item: MenuItem) {
        if (!this.hasSubmenu()) {
            this.submenu = new Submenu();
            this.element.classList.add("has-sub");

            const menuBox = document.createElement("div");
            menuBox.classList.add("menu-box", "menu-item-submenu");
            this.element.appendChild(menuBox);
        }

        item.setParent(this);
        this.submenu?.push(item);
        this.element.querySelector(".menu-box")?.appendChild(item.getElement());
    }

    insertChild(item: MenuItem, index: number): void {
        if (!this.hasSubmenu()) {
            this.submenu = new Submenu();
            this.element.classList.add("has-sub");

            const menuBox = document.createElement("div");
            menuBox.classList.add("menu-box", "menu-item-submenu");
            this.element.appendChild(menuBox);
        }

        item.setParent(this);
        this.submenu?.splice(index, 0, item);
        const menuElmnt = this.element.querySelector(".menu-box");
        menuElmnt?.insertBefore(item.getElement(), menuElmnt.children[index] || null);
    }

    removeChild(item: MenuItem): void;
    removeChild(index: number): void;
    removeChild(x: MenuItem | number) {
        if (x instanceof MenuItem) {
            this.submenu?.splice(this.submenu?.indexOf(x), 1);
            x.getElement().parentElement?.removeChild(x.getElement());
            return;
        }

        const item = this.submenu?.splice(x, 1)[0];
        item?.getElement().parentElement?.removeChild(item?.getElement());
    }

    public getAppMenuRoot(): ApplicationMenu | null {
        let result: MenuItem | MenuLabel | ApplicationMenu | undefined = this.parent;
        while (result && !(result instanceof ApplicationMenu)) {
            result = result.getParent();
        }

        if (result instanceof ApplicationMenu) {
            return result;
        }

        return null;
    }

    public bounce(): void {
        const duration = parseFloat(window.getComputedStyle(this.element).animationDuration) * 1000;
        this.element.classList.add("bounce");

        setTimeout(() => {
            this.element.classList.remove("bounce");
        }, duration);
    }

    public getElement() {
        return this.element;
    }

    public getLabelText() {
        return this.labelText;
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

    public getAltTrigger() {
        return this.altTrigger;
    }

    public getSubmenu() {
        return this.submenu;
    }

    public hasSubmenu() {
        return this.submenu !== undefined;
    }

    public getEmitter() {
        return this.emitter;
    }

    public getParent() {
        return this.parent;
    }

    public isExecutable() {
        return this.enabled && !this.separator && !this.hasSubmenu();
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
        Utils.setToggleClass(this.element, "open", flag);
    }

    public setParent(parent: MenuLabel | MenuItem) {
        this.parent = parent;
    }
}
