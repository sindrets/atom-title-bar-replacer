import { CompositeDisposable } from "atom";
import { TitleBarReplacerView } from "./TitleBarReplacerView";

export class TitleBarReplacer {
    private subscriptions: CompositeDisposable;
    private titleBarReplacerView!: TitleBarReplacerView;

    public constructor() {
        this.subscriptions = new CompositeDisposable();
    }

    public activate(state: any): void {
        let panesElmnt = document.querySelector("atom-pane-container.panes");
        let intervalId = setInterval(() => {
            if (panesElmnt == null) {
                panesElmnt = document.querySelector("atom-pane-container.panes");
            }
            if (panesElmnt !== null) {
                if (window.getComputedStyle(panesElmnt).display === "flex") {
                    clearInterval(intervalId);
                    this.titleBarReplacerView = new TitleBarReplacerView();
                    document
                        .querySelector(".workspace")
                        ?.prepend(this.titleBarReplacerView.getElement());
                    this.titleBarReplacerView.updateTransforms();
                }
            }
        }, 50);
    }

    public deactivate(): void {
        this.subscriptions?.dispose();
    }

    public serialize(): any {}

    public deserialize(data: any): any {}
}
