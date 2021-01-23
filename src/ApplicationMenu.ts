import EventEmitter from "events";
import { IMenuLabel } from "./IMenuLabel";
import { MenuLabel } from "./MenuLabel";
import { TbrEvent } from "./TbrEvent";

export class ApplicationMenu {
    private element: HTMLDivElement;
    private labels: MenuLabel[];
    private open: boolean = false;
    private emitter: EventEmitter;

    private constructor(element: HTMLDivElement) {
        this.element = element;
        this.labels = [];
        this.emitter = new EventEmitter();

        this.emitter.on(TbrEvent.MOUSE_CLICK, (...args) => this.onLabelClicked(args[0], args[1]));
        this.emitter.on(TbrEvent.MOUSE_ENTER, (...args) =>
            this.onLabelMouseEnter(args[0], args[1])
        );

        window.addEventListener("click", (e) => this.close());
    }

    public static createApplicationMenu(menuTemplate: IMenuLabel[]): ApplicationMenu {
        const menuElement = document.createElement("div");
        menuElement.classList.add("app-menu");

        const self = new ApplicationMenu(menuElement);

        const labels: MenuLabel[] = [];
        menuTemplate.forEach((o) => {
            try {
                const labelItem = MenuLabel.createMenuLabel(o, self.emitter);
                labels.push(labelItem);
                menuElement.appendChild(labelItem.getElement());
            } catch (e) {
                console.error(e);
            }
        });
        self.labels = labels;

        return self;
    }

    private onLabelClicked(target: MenuLabel, e: MouseEvent): void {
        if (target.isOpen()) {
            target.setOpen(false);
            this.open = false;
            return;
        }
        this.labels.forEach((o) => {
            o.setOpen(false);
        });
        target.setOpen(true);
        this.open = true;
    }

    private onLabelMouseEnter(target: MenuLabel, e: MouseEvent): void {
        if (this.open && !target.isOpen()) {
            this.onLabelClicked(target, e);
        }
    }

    public close(): void {
        this.labels.forEach((o) => {
            o.setOpen(false);
        });
        this.open = false;
    }

    public getElement() {
        return this.element;
    }

    public getLabels() {
        return this.labels;
    }

    public isOpen() {
        return this.open;
    }
}
