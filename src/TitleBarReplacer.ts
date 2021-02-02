import { CompositeDisposable } from "atom";
import { TitleBarReplacerView } from "./TitleBarReplacerView";
import { TbrConfig } from "./types";
import { ThemeManager } from "./ThemeManager";

export class TitleBarReplacer {
    public static configState: TbrConfig = new TbrConfig();
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
                    this.titleBarReplacerView = new TitleBarReplacerView(
                        TitleBarReplacer.configState
                    );
                    document
                        .querySelector("atom-workspace")
                        ?.prepend(this.titleBarReplacerView.getElement());
                    this.titleBarReplacerView.updateTransforms();
                    this.initSubscriptions();
                }
            }
        }, 50);

        // TODO remove before publish
        // @ts-ignore
        window.titleBarReplacer = this;
    }

    public initSubscriptions(): void {
        atom.config.observe("title-bar-replacer.general.displayTitleBar", (value) => {
            TitleBarReplacer.configState.displayTitleBar = value;
            this.titleBarReplacerView.setTitleBarVisible(value);
        });
        atom.config.observe("title-bar-replacer.general.displayMenuBar", (value) => {
            TitleBarReplacer.configState.displayMenuBar = value;
            if (!TitleBarReplacer.configState.autoHide) {
                this.titleBarReplacerView.setMenuBarVisible(value);
            }
        });
        atom.config.observe("title-bar-replacer.general.openAdjacent", (value) => {
            TitleBarReplacer.configState.openAdjacent = value;
        });
        atom.config.observe("title-bar-replacer.general.autoHide", (value) => {
            TitleBarReplacer.configState.autoHide = value;
            if (value) {
                this.titleBarReplacerView.setMenuBarVisible(false);
            } else {
                this.titleBarReplacerView.setMenuBarVisible(
                    TitleBarReplacer.configState.displayMenuBar
                );
            }
        });
        atom.config.observe("title-bar-replacer.general.hideFullscreenTitle", (value) => {
            TitleBarReplacer.configState.hideFullscreenTitle = value;
            if (atom.isFullScreen()) {
                this.titleBarReplacerView.setTitleBarVisible(!value);
            }
        });
        atom.config.observe("title-bar-replacer.colors.autoSelectColor", (value) => {
            TitleBarReplacer.configState.autoSelectColor = value;
            value ? ThemeManager.clearCustomColors() : ThemeManager.applyCustomColors();
        });
        atom.config.observe("title-bar-replacer.colors.style", (value) => {
            TitleBarReplacer.configState.titleBarStyle = value;
            this.titleBarReplacerView.getThemeManager().setTitleBarStyle(value);
        });
        atom.config.observe("title-bar-replacer.colors.controlTheme", (value) => {
            TitleBarReplacer.configState.windowControlTheme = value;
            this.titleBarReplacerView.getThemeManager().setWindowControlTheme(value);
        });
        atom.config.observe("title-bar-replacer.colors.controlLocation", (value) => {
            TitleBarReplacer.configState.reverseWindowControls = value;
            this.titleBarReplacerView.getThemeManager().setReverseWindowControls(value);
        });
    }

    public deactivate(): void {
        this.subscriptions?.dispose();
        this.titleBarReplacerView.deactivate();
    }

    public serialize(): any {}

    public deserialize(data: any): any {}
}
