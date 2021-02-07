import { CompositeDisposable } from "atom";
import { ThemeManager } from "./ThemeManager";
import { TitleBarReplacerView } from "./TitleBarReplacerView";
import { TbrConfig } from "./types";

export class TitleBarReplacer {
    public static configState: TbrConfig = new TbrConfig();
    private subscriptions: CompositeDisposable;
    private titleBarReplacerView!: TitleBarReplacerView;
    private initialized: boolean = false;

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
                    this.initialized = true;
                }
            }
        }, 50);

        // TODO remove before publish
        // @ts-ignore
        window.titleBarReplacer = this;
    }

    public initSubscriptions(): void {
        this.subscriptions.add(
            atom.commands.add("atom-workspace", {
                "title-bar-replacer:toggle-title-bar": () => {
                    TitleBarReplacer.configState.displayTitleBar = !TitleBarReplacer.configState
                        .displayTitleBar;
                    this.titleBarReplacerView.setTitleBarVisible(
                        TitleBarReplacer.configState.displayTitleBar
                    );
                },
                "title-bar-replacer:toggle-menu-bar": () => {
                    TitleBarReplacer.configState.displayMenuBar = !TitleBarReplacer.configState
                        .displayMenuBar;
                    this.titleBarReplacerView.setMenuBarVisible(
                        TitleBarReplacer.configState.displayMenuBar
                    );
                },
                "title-bar-replacer:auto-select-colors": () => {
                    TitleBarReplacer.configState.autoSelectColor = !TitleBarReplacer.configState
                        .autoSelectColor;
                    TitleBarReplacer.configState.autoSelectColor
                        ? ThemeManager.clearCustomColors()
                        : ThemeManager.applyCustomColors();
                },
                "title-bar-replacer:run-menu-updater": () => {
                    this.titleBarReplacerView.updateMenu();
                },
                "title-bar-replacer:force-rebuild-application-menu": () => {
                    this.titleBarReplacerView.rebuildApplicationMenu();
                },
            })
        );
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
        atom.config.observe("title-bar-replacer.colors.baseColor", (value) => {
            TitleBarReplacer.configState.baseColor = value;
            if (!TitleBarReplacer.configState.autoSelectColor && this.initialized) {
                ThemeManager.applyCustomColors();
            }
        });
        atom.config.observe("title-bar-replacer.colors.highlightColor", (value) => {
            TitleBarReplacer.configState.highlightColor = value;
            if (!TitleBarReplacer.configState.autoSelectColor && this.initialized) {
                ThemeManager.applyCustomColors();
            }
        });
        atom.config.observe("title-bar-replacer.colors.textColor", (value) => {
            TitleBarReplacer.configState.textColor = value;
            if (!TitleBarReplacer.configState.autoSelectColor && this.initialized) {
                ThemeManager.applyCustomColors();
            }
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
