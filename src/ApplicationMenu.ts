import EventEmitter from "events";
import { MenuItem } from "./MenuItem";
import { MenuLabel } from "./MenuLabel";
import { IMenuLabel, MenuLike, TbrEvent } from "./types";
import { Utils } from "./Utils";

export class ApplicationMenu {
    private element: HTMLDivElement;
    private labels: MenuLabel[];
    private showingAltKeys = false;
    private emitter: EventEmitter;

    private constructor(element: HTMLDivElement) {
        this.element = element;
        this.labels = [];
        this.emitter = new EventEmitter();

        this.emitter.on(TbrEvent.MOUSE_CLICK, (...args) => this.onLabelClicked(args[0], args[1]));
        this.emitter.on(TbrEvent.MOUSE_ENTER, (...args) =>
            this.onLabelMouseEnter(args[0], args[1])
        );

        window.addEventListener("click", (e) => {
            this.close();
            this.showAltKeys(false);
        });

        document
            .querySelector("atom-workspace")
            ?.addEventListener("keydown", (e) => this.onKeyDown(e as KeyboardEvent));
        document
            .querySelector("atom-workspace")
            ?.addEventListener("keyup", (e) => this.onKeyUp(e as KeyboardEvent));
    }

    public static createApplicationMenu(menuTemplate: IMenuLabel[]): ApplicationMenu {
        const menuElement = document.createElement("div");
        menuElement.classList.add("app-menu");

        const self = new ApplicationMenu(menuElement);

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
        if (this.isOpen() && !target.isOpen()) {
            this.onLabelClicked(target, e);
        }
    }

    private onKeyDown(e: KeyboardEvent): void {
        if (
            !e.repeat &&
            (e.key === "Alt" || e.key === "Escape") &&
            (this.showingAltKeys || this.isOpen())
        ) {
            this.close();
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

                case " ":   // Space
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
            if (this.showingAltKeys && !e.repeat) {
                let handled = false;

                this.labels.some((o) => {
                    if (
                        o.getAltTrigger() !== undefined &&
                        o.getAltTrigger() === e.key.toLowerCase()
                    ) {
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
            this.openFirstLabel();
        }
    }

    public close(): void {
        this.labels.forEach((o) => {
            o.setOpen(false);
        });
    }

    public showAltKeys(flag: boolean): void {
        Utils.setToggleClass(this.element, "alt-down", flag);
        this.showingAltKeys = flag;
    }

    public openFirstLabel(): void {
        this.labels[0]?.setOpen(true);
    }

    public openLastLabel(): void {
        this.labels[this.labels.length]?.setOpen(true);
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

    public getElement() {
        return this.element;
    }

    public getLabels() {
        return this.labels;
    }

    public isOpen() {
        return this.getOpenLabel() !== null;
    }

    public getEmitter() {
        return this.emitter;
    }

    public addLabel(labelItem: MenuLabel) {
        labelItem.setParent(this);
        this.labels.push(labelItem);
        this.element.appendChild(labelItem.getElement());
    }
}
