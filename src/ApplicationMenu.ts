import EventEmitter from "events";
import { MenuItem } from "./MenuItem";
import { MenuLabel } from "./MenuLabel";
import { TitleBarReplacer } from "./TitleBarReplacer";
import { TitleBarReplacerView } from "./TitleBarReplacerView";
import { IMenuLabel, MenuLike, TbrEvent } from "./types";
import { Utils } from "./Utils";

export class ApplicationMenu {
    private element: HTMLDivElement;
    private labels: MenuLabel[];
    private showingAltKeys = false;
    private emitter: EventEmitter;
    private parent?: TitleBarReplacerView;

    private constructor(element: HTMLDivElement, parent?: TitleBarReplacerView) {
        this.element = element;
        this.labels = [];
        this.emitter = new EventEmitter();
        if (parent) {
            this.parent = parent;
        }

        this.emitter.on(TbrEvent.MOUSE_CLICK, (...args) => this.onLabelClicked(args[0], args[1]));
        this.emitter.on(TbrEvent.MOUSE_ENTER, (...args) =>
            this.onLabelMouseEnter(args[0], args[1])
        );

        window.addEventListener("click", (e) => {
            this.close();
            this.getFocusedLabel()?.setFocused(false);
            this.showAltKeys(false);
        });

        document.body.addEventListener("keydown", (e) => this.onKeyDown(e as KeyboardEvent));
        document.body.addEventListener("keyup", (e) => this.onKeyUp(e as KeyboardEvent));
    }

    public static createApplicationMenu(
        menuTemplate: IMenuLabel[],
        parent?: TitleBarReplacerView
    ): ApplicationMenu {
        const menuElement = document.createElement("div");
        menuElement.classList.add("app-menu");

        const self = new ApplicationMenu(menuElement, parent);

        self.labels = [];
        menuTemplate.forEach((o) => {
            try {
                self.addLabel(MenuLabel.createMenuLabel(o));
            } catch (e) {
                console.error(e);
            }
        });

        return self;
    }

    public serialize() {
        return this.labels.map((o) => {
            return o.serialize();
        });
    }

    private onLabelClicked(target: MenuLabel, e: MouseEvent): void {
        if (target.isOpen()) {
            target.setOpen(false);
            return;
        }
        this.labels.forEach((o) => {
            o.setOpen(false);
        });
        target.setOpen(true);
    }

    private onLabelMouseEnter(target: MenuLabel, e: MouseEvent): void {
        if (this.isOpen() && !target.isOpen() && TitleBarReplacer.configState.openAdjacent) {
            this.onLabelClicked(target, e);
        }
    }

    private onKeyDown(e: KeyboardEvent): void {
        if (
            !e.repeat &&
            (e.key === "Alt" || e.key === "Escape") &&
            (this.showingAltKeys || this.isOpen() || this.isFocused())
        ) {
            this.close();
            this.getFocusedLabel()?.setFocused(false);
            this.showAltKeys(false);
            return;
        }

        if (e.key === "Alt") {
            if (e.repeat) {
                return;
            }
            this.showAltKeys(!this.showingAltKeys);
            return;
        }

        const openLabel = this.getOpenLabel();
        const focusedLabel = this.getFocusedLabel();
        if (openLabel) {
            let selected = this.getSelectedLeaf();
            switch (e.key) {
                case "ArrowUp":
                    if (!selected) {
                        openLabel.getSubmenu().selectLastItem();
                    } else {
                        selected.getParent()?.getSubmenu()?.selectPreviousItem();
                    }
                    Utils.stopEvent(e);
                    return;

                case "ArrowDown":
                    if (!selected) {
                        openLabel.getSubmenu().selectFirstItem();
                    } else {
                        selected.getParent()?.getSubmenu()?.selectNextItem();
                    }
                    Utils.stopEvent(e);
                    return;

                case "ArrowLeft":
                    if (!selected || selected.getParent() instanceof MenuLabel) {
                        this.openPreviousLabel();
                    } else {
                        selected.getParent()?.setOpen(false);
                    }
                    Utils.stopEvent(e);
                    return;

                case "ArrowRight":
                    if (!selected || !selected.hasSubmenu()) {
                        this.openNextLabel();
                    } else {
                        selected.setOpen(true);
                        selected.getSubmenu()?.selectFirstItem();
                    }
                    Utils.stopEvent(e);
                    return;

                case "Enter":
                    if (selected && !selected.hasSubmenu()) {
                        selected.execCommand();
                        this.close();
                        this.showAltKeys(false);
                        Utils.stopEvent(e);
                        return;
                    }
                    break;

                case " ": // Space
                    if (selected && !selected.hasSubmenu()) {
                        selected.bounce();
                        selected.execCommand();
                        Utils.stopEvent(e);
                        return;
                    }
                    break;
            }

            if (this.showingAltKeys && !e.repeat) {
                let target = this.getOpenLeaf();
                if (target) {
                    let handled = false;

                    target
                        .getSubmenu()
                        ?.getSelectable()
                        .some((o) => {
                            if (
                                o.getAltTrigger() !== undefined &&
                                o.getAltTrigger() === e.key.toLowerCase()
                            ) {
                                o.execCommand();
                                this.close();
                                this.showAltKeys(false);
                                Utils.stopEvent(e);
                                handled = true;
                                return true;
                            }
                            return false;
                        });

                    if (handled) {
                        return;
                    }
                }
            }
        } else {
            if (focusedLabel) {
                switch (e.key) {
                    case "Enter":
                    case "ArrowDown":
                        focusedLabel.setOpen(true);
                        Utils.stopEvent(e);
                        return;

                    case "ArrowLeft":
                        this.focusPreviousLabel();
                        Utils.stopEvent(e);
                        return;

                    case "ArrowRight":
                        this.focusNextLabel();
                        Utils.stopEvent(e);
                        return;
                }
            }
            if (this.showingAltKeys && !e.repeat) {
                let handled = false;

                this.labels.some((o) => {
                    if (
                        o.getAltTrigger() !== undefined &&
                        o.getAltTrigger() === e.key.toLowerCase()
                    ) {
                        if (focusedLabel) {
                            focusedLabel.setFocused(false);
                        }
                        o.setOpen(true);
                        Utils.stopEvent(e);
                        handled = true;
                        return true;
                    }
                    return false;
                });

                if (handled) {
                    return;
                }
            }
        }

        this.showAltKeys(false);
    }

    public onKeyUp(e: KeyboardEvent): void {
        if (e.key === "Alt" && this.showingAltKeys && !this.isOpen()) {
            if (TitleBarReplacer.configState.autoHide) {
                this.parent?.setMenuBarVisible(true);
            }
            this.focusFirstLabel();
        }
    }

    public close(): void {
        this.labels.forEach((o) => {
            if (o.isOpen()) {
                o.setOpen(false);
            }
        });
        if (TitleBarReplacer.configState.autoHide) {
            this.parent?.setMenuBarVisible(false);
        }
    }

    public showAltKeys(flag: boolean): void {
        Utils.setToggleClass(this.element, "alt-down", flag);
        this.showingAltKeys = flag;
    }

    public openFirstLabel(): void {
        this.labels[0]?.setOpen(true);
    }

    public openLastLabel(): void {
        this.labels[this.labels.length - 1]?.setOpen(true);
    }

    public openNextLabel(): void {
        let label = this.getOpenLabel();
        if (label) {
            label.setOpen(false);
            this.labels[Utils.mod(this.labels.indexOf(label) + 1, this.labels.length)].setOpen(
                true
            );
        }
    }

    public openPreviousLabel(): void {
        let label = this.getOpenLabel();
        if (label) {
            label.setOpen(false);
            this.labels[Utils.mod(this.labels.indexOf(label) - 1, this.labels.length)].setOpen(
                true
            );
        }
    }

    public focusFirstLabel(): void {
        this.labels.forEach((o) => {
            o.setFocused(false);
        });
        this.labels[0]?.setFocused(true);
    }

    public focusLastLabel(): void {
        this.labels.forEach((o) => {
            o.setFocused(false);
        });
        this.labels[this.labels.length - 1]?.setFocused(true);
    }

    public focusNextLabel(): void {
        let label = this.getFocusedLabel();
        if (label) {
            label.setFocused(false);
            this.labels[Utils.mod(this.labels.indexOf(label) + 1, this.labels.length)].setFocused(
                true
            );
        }
    }

    public focusPreviousLabel(): void {
        let label = this.getFocusedLabel();
        if (label) {
            label.setFocused(false);
            this.labels[Utils.mod(this.labels.indexOf(label) - 1, this.labels.length)].setFocused(
                true
            );
        }
    }

    public getOpenLeaf(): MenuLike | null {
        let result: MenuLike | null = null;

        const recurseItem = (item: MenuLike): MenuLike | null => {
            let curr: MenuLike | null = null;
            item.getSubmenu()?.some((o) => {
                if (o.hasSubmenu() && o.isOpen()) {
                    curr = o;
                    let tmp = recurseItem(o);
                    if (tmp !== null) {
                        curr = tmp;
                    }
                    return true;
                }
                return false;
            });
            return curr;
        };

        this.labels.some((o) => {
            if (o.isOpen()) {
                result = o;
                let tmp = recurseItem(o);
                if (tmp !== null) {
                    result = tmp;
                }
                return true;
            }
            return false;
        });

        return result;
    }

    public getSelectedLeaf(): MenuItem | null {
        let result: MenuItem | null = null;

        const recurseItem = (item: MenuLike): MenuLike | null => {
            let curr: MenuLike | null = null;
            item.getSubmenu()?.some((o) => {
                if (o.isSelected()) {
                    curr = o;
                    if (o.hasSubmenu() && o.isOpen()) {
                        let tmp = recurseItem(o);
                        if (tmp !== null) {
                            curr = tmp;
                        }
                        return true;
                    }
                }
                return false;
            });
            return curr;
        };

        this.labels.some((o) => {
            if (o.isOpen()) {
                let tmp = recurseItem(o);
                if (tmp !== null) {
                    result = tmp as MenuItem;
                }
                return true;
            }
            return false;
        });

        return result;
    }

    public getOpenLabel(): MenuLabel | null {
        let result: MenuLabel | null = null;

        this.labels.some((o) => {
            if (o.isOpen()) {
                result = o;
                return true;
            }
            return false;
        });

        return result;
    }

    public getFocusedLabel(): MenuLabel | null {
        let result: MenuLabel | null = null;

        this.labels.some((o) => {
            if (o.isFocused()) {
                result = o;
                return true;
            }
            return false;
        });

        return result;
    }

    public getElement() {
        return this.element;
    }

    public getLabels() {
        return this.labels;
    }

    public isOpen() {
        return this.getOpenLabel() !== null;
    }

    public isFocused() {
        return this.getFocusedLabel() !== null;
    }

    public getEmitter() {
        return this.emitter;
    }

    public addLabel(labelItem: MenuLabel) {
        labelItem.setParent(this);
        this.labels.push(labelItem);
        this.element.appendChild(labelItem.getElement());
    }

    insertLabel(item: MenuLabel, index: number): void {
        item.setParent(this);
        this.labels.splice(index, 0, item);
        this.element.insertBefore(
            item.getElement(),
            item.getElement().parentElement?.children[index] || null
        );
    }

    removeLabel(item: MenuLabel): void;
    removeLabel(index: number): void;
    removeLabel(x: MenuLabel | number) {
        if (x instanceof MenuLabel) {
            this.labels.splice(this.labels.indexOf(x), 1);
            x.getElement().parentElement?.removeChild(x.getElement());
            return;
        }

        const item = this.labels.splice(x, 1)[0];
        item?.getElement().parentElement?.removeChild(item?.getElement());
    }
}
