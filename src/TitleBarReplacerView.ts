import { ApplicationMenu } from "./ApplicationMenu";
// @ts-ignore
import { remote } from "electron";
import { TbrConfig, TbrWindowControls } from "./types";
import { Utils } from "./Utils";
import { ThemeManager } from "./ThemeManager";
import { ChangeType, MenuUpdater } from "./MenuUpdater";

export class TitleBarReplacerView {
    private configState: TbrConfig;
    private themeManager: ThemeManager;
    private element: HTMLDivElement;
    private windowControls: TbrWindowControls;
    private appMenu: ApplicationMenu;
    private titleBarVisible: boolean = true;
    private menuBarVisible: boolean = true;

    public constructor(configState: TbrConfig) {
        this.configState = configState;
        this.themeManager = new ThemeManager(this);

        this.element = document.createElement("div");
        this.element.classList.add("title-bar-replacer");

        const menuDiv = document.createElement("div");
        menuDiv.classList.add("tbr-title-bar");

        const titleSpan = document.createElement("span");
        titleSpan.classList.add("custom-title");
        let titleString = "Atom";
        titleSpan.innerHTML = titleString;
        menuDiv.appendChild(titleSpan);

        const controlWrap = document.createElement("div");
        controlWrap.classList.add("control-wrap");
        menuDiv.appendChild(controlWrap);

        const controlMinimize = document.createElement("i");
        controlMinimize.textContent = "control_minimize";
        controlMinimize.classList.add("tbr-minimize");
        controlWrap.appendChild(controlMinimize);

        const controlMaximize = document.createElement("i");
        controlMaximize.textContent = "control_maximize";
        controlMaximize.classList.add("tbr-maximize");
        controlWrap.appendChild(controlMaximize);

        const controlClose = document.createElement("i");
        controlClose.textContent = "control_close";
        controlClose.classList.add("tbr-close");
        controlWrap.appendChild(controlClose);

        this.windowControls = {
            minimize: controlMinimize,
            maximize: controlMaximize,
            close: controlClose,
        };

        this.element.appendChild(menuDiv);
        this.initWindowControls();

        const titleObserver = new MutationObserver((mutations, self) => {
            mutations.forEach((o) => {
                if (o.type === "childList") {
                    this.setTitleText(o.target.textContent || "Atom");
                }
            });
        });

        const titleElmnt = document.querySelector("title");
        if (titleElmnt !== null) {
            titleObserver.observe(titleElmnt, { childList: true });
        }

        // @ts-ignore
        let menuTemplate = atom.menu.template;
        this.appMenu = ApplicationMenu.createApplicationMenu(menuTemplate, this);
        this.element.appendChild(this.appMenu.getElement());
        this.updateTitleText();
        // TODO remove
        // @ts-ignore
        window.appMenu = this.appMenu;

        const originalUpdate = atom.menu.update;
        atom.menu.update = (...args) => {
            originalUpdate.apply(atom.menu, ...args);
            const change = MenuUpdater.run(this.appMenu);
            if (change === ChangeType.ADDITION) {
                this.updateTransforms();
            }
        };
    }

    public updateTransforms(): void {
        document.querySelectorAll(".menu-box.menu-item-submenu").forEach((o) => {
            const parentRect = o.parentElement?.getBoundingClientRect() as DOMRect;
            const selfRect = o.getBoundingClientRect();
            (o as HTMLElement).style.transform = `translate(${
                parentRect.width - (selfRect.x - parentRect.x) - 5
            }px, -3px)`;
        });
    }

    public initWindowControls(): void {
        const mainWindow = remote.getCurrentWindow();

        mainWindow.on("maximize", () => {
            this.windowControls.maximize.innerHTML = "control_restore";
        });

        mainWindow.on("unmaximize", () => {
            this.windowControls.maximize.innerHTML = "control_maximize";
        });

        mainWindow.on("enter-full-screen", () => {
            this.windowControls.maximize.classList.add("disabled");
            if (this.configState.hideFullscreenTitle) {
                this.setTitleBarVisible(false);
            }
        });

        mainWindow.on("leave-full-screen", () => {
            this.windowControls.maximize.classList.remove("disabled");
            if (this.configState.displayTitleBar) {
                this.setTitleBarVisible(true);
            }
        });

        mainWindow.on("blur", () => {
            document.body.click();
        });

        this.windowControls.minimize.addEventListener("click", () => {
            mainWindow.minimize();
        });

        this.windowControls.maximize.addEventListener("click", () => {
            if (!mainWindow.isMaximized()) {
                mainWindow.maximize();
                this.windowControls.maximize.innerHTML = "control_restore";
            } else {
                mainWindow.unmaximize();
                this.windowControls.maximize.innerHTML = "control_maximize";
            }
        });

        this.windowControls.close.addEventListener("click", () => {
            mainWindow.close();
        });

        if (mainWindow.isMaximized()) {
            this.windowControls.maximize.innerHTML = "control_restore";
        } else {
            this.windowControls.maximize.innerHTML = "control_maximize";
        }
    }

    public setTitleBarVisible(flag: boolean): void {
        this.titleBarVisible = flag;
        Utils.setToggleClass(
            this.element.querySelector(".tbr-title-bar") as HTMLElement,
            "no-title-bar",
            !flag
        );
    }

    public setMenuBarVisible(flag: boolean): void {
        this.menuBarVisible = flag;
        Utils.setToggleClass(this.appMenu.getElement(), "no-menu-bar", !flag);
    }

    public setTitleText(title: string): void {
        const titleElmnt = this.getElement().querySelector(".custom-title");
        if (titleElmnt !== null) {
            titleElmnt.innerHTML = title;
        }
    }

    public updateTitleText(): void {
        const titleElmnt = document.querySelector("title");
        const customTitleElmnt = this.element.querySelector(".custom-title");
        if (titleElmnt !== null && customTitleElmnt !== null) {
            customTitleElmnt.innerHTML = titleElmnt.textContent || "Atom";
        }
    }

    public deactivate(): void {
        this.element.parentElement?.removeChild(this.element);
    }

    public getThemeManager() {
        return this.themeManager;
    }

    public getElement() {
        return this.element;
    }

    public isTitleBarVisible() {
        return this.titleBarVisible;
    }

    public isMenuBarVisible() {
        return this.menuBarVisible;
    }
}
