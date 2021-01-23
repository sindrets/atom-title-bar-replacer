import { ApplicationMenu } from "./ApplicationMenu";

export class TitleBarReplacerView {
    private element: HTMLDivElement;
    private appMenu: ApplicationMenu;

    public constructor() {
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

        const tbrMinimize = document.createElement("i");
        tbrMinimize.textContent = "control_minimize";
        tbrMinimize.classList.add("tbr-minimize");
        controlWrap.appendChild(tbrMinimize);

        const tbrMaximize = document.createElement("i");
        tbrMaximize.textContent = "control_maximize";
        tbrMaximize.classList.add("tbr-maximize");
        controlWrap.appendChild(tbrMaximize);

        const customClose = document.createElement("i");
        customClose.textContent = "control_close";
        customClose.classList.add("tbr-close");
        controlWrap.appendChild(customClose);

        this.element.appendChild(menuDiv);

        // @ts-ignore
        let menuTemplate = atom.menu.template;
        this.appMenu = ApplicationMenu.createApplicationMenu(menuTemplate);
        this.element.appendChild(this.appMenu.getElement());
    }

    public updateTransforms(): void {
        document.querySelectorAll(".menu-box").forEach((o) => {
            if (o.classList.contains("menu-item-submenu")) {
                const parentRect = o.parentElement?.getBoundingClientRect() as DOMRect;
                const selfRect = o.getBoundingClientRect();
                (o as HTMLElement).style.transform = `translate(${
                    parentRect.width - (selfRect.x - parentRect.x) - 5
                }px, -3px)`;
            }
        });
    }

    public getElement() {
        return this.element;
    }
}
