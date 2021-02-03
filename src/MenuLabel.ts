import EventEmitter from "events";
import { ApplicationMenu } from "./ApplicationMenu";
import { MalformedTemplateError } from "./MalformedTemplateError";
import { MenuItem } from "./MenuItem";
import { IMenuLabel, MenuLike, TbrEvent } from "./types";
import { Utils } from "./Utils";
import { Submenu } from "./Submenu";

export class MenuLabel implements MenuLike {
    private element: HTMLSpanElement;
    private labelText!: string;
    private submenu: Submenu;
    private open: boolean = false;
    private focused: boolean = false;
    private altTrigger?: string;
    private emitter: EventEmitter;
    private parent?: ApplicationMenu;

    private constructor(element: HTMLSpanElement) {
        this.element = element;
        this.submenu = new Submenu();
        this.emitter = new EventEmitter();

        this.emitter.on(TbrEvent.MOUSE_CLICK, (...args) => this.onSubItemClick(args[0], args[1]));
        this.emitter.on(TbrEvent.MOUSE_ENTER, (...args) =>
            this.onSubItemMouseEnter(args[0], args[1])
        );

        this.element.addEventListener("click", (e) => this.onMouseClick(e));
        this.element.addEventListener("mouseenter", (e) => this.onMouseEnter(e));
    }

    /**
     * @throws {MalformedTemplateError}
     */
    public static createMenuLabel(labelItem: IMenuLabel): MenuLabel {
        if (labelItem.label === undefined || !labelItem.submenu) {
            throw new MalformedTemplateError("Label template is malformed!");
        }

        const elmnt = document.createElement("span");
        elmnt.classList.add("menu-label");
        const labelData = Utils.formatAltKey(labelItem.label);
        elmnt.setAttribute("label", labelData.name);
        elmnt.setAttribute("alt-trigger", labelData.key as string);
        elmnt.innerHTML = labelData.html;

        const self = new MenuLabel(elmnt);
        self.labelText = labelItem.label;
        self.altTrigger = labelData.key || undefined;

        const submenuElmnt = document.createElement("div");
        submenuElmnt.classList.add("menu-box");
        elmnt.appendChild(submenuElmnt);

        labelItem.submenu.forEach((o) => {
            try {
                self.addChild(MenuItem.createMenuItem(o));
            } catch (e) {
                console.error(e);
            }
        });

        return self;
    }

    private onMouseClick(e: MouseEvent) {
        e.stopPropagation();
        this.parent?.getEmitter().emit(TbrEvent.MOUSE_CLICK, this, e);
    }

    private onMouseEnter(e: MouseEvent) {
        e.stopPropagation();
        this.parent?.getEmitter().emit(TbrEvent.MOUSE_ENTER, this, e);
    }

    private onSubItemClick(target: MenuItem, e: MouseEvent): void {}

    private onSubItemMouseEnter(target: MenuItem, e: MouseEvent): void {
        this.submenu.forEach((o) => {
            o.setOpen(false);
            o.setSelected(false);
        });
        if (target.isEnabled()) {
            target.setSelected(true);
            if (target.hasSubmenu()) {
                target.setOpen(true);
            }
        }
    }

    public getElement() {
        return this.element;
    }

    public getLabelText() {
        return this.labelText;
    }

    public getSubmenu() {
        return this.submenu;
    }

    public isOpen() {
        return this.open;
    }

    public isFocused() {
        return this.focused;
    }

    public getAltTrigger() {
        return this.altTrigger;
    }

    public getEmitter() {
        return this.emitter;
    }

    public getParent() {
        return this.parent;
    }

    public setOpen(flag: boolean) {
        this.open = flag;
        if (flag) {
            this.setFocused(false);
        }
        this.submenu.forEach((o) => {
            o.setOpen(false);
            if (!flag) o.setSelected(false);
        });
        Utils.setToggleClass(this.element, "open", flag);
    }

    public setFocused(flag: boolean) {
        this.focused = flag;
        Utils.setToggleClass(this.element, "focused", flag);
    }

    public setParent(parent: ApplicationMenu) {
        this.parent = parent;
    }

    public addChild(item: MenuItem) {
        item.setParent(this);
        this.submenu.push(item);
        this.element.querySelector(".menu-box")?.appendChild(item.getElement());
    }

    insertChild(item: MenuItem, index: number): void {
        item.setParent(this);
        this.submenu?.splice(index, 0, item);
        this.element
            .querySelector(".menu-box")
            ?.insertBefore(
                item.getElement(),
                item.getElement().parentElement?.children[index] || null
            );
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
}
