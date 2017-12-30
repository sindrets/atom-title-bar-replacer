import TitleBarReplacerView from "./title-bar-replacer-view";

var _this: MenuUpdater;

export default class MenuUpdater {

    titleBarReplacerView: TitleBarReplacerView;
    lastMenu: TbrCore.MenuItem[];
    currMenu: TbrCore.MenuItem[];

    constructor(titleBarReplacerView: TitleBarReplacerView) {
        _this = this;
        this.titleBarReplacerView = titleBarReplacerView;
    }

    public run(): void {
        this.lastMenu = this.titleBarReplacerView.getCurrentTemplate().slice(0);
        this.currMenu = JSON.parse(JSON.stringify(atom.menu.template)); // Deep clone menu template

        // Sort packages alphabetically
        var alphabeticalSort = (function(a: TbrCore.MenuItem | any, b: TbrCore.MenuItem | any) {
            var nameA = a.label.toLowerCase(),
                nameB = b.label.toLowerCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        });
        for (var i = 0; i < this.lastMenu.length; i++) {
            if (this.lastMenu[i].label == "&Packages") {
                (this.lastMenu[i].submenu as TbrCore.MenuItem[]).sort(alphabeticalSort);
            }
        }
        for (var i = 0; i < this.currMenu.length; i++) {
            if (this.currMenu[i].label == "&Packages") {
                (this.currMenu[i].submenu as TbrCore.MenuItem[]).sort(alphabeticalSort);
            }
        }

        var iLast = [0];
        var iCurr = [0];
        this.traverseTemplate(iLast, iCurr);

    }

    //Compare current menu template to the previous template and make necessary changes
    private traverseTemplate(indexListLast: number[], indexListCurr: number[]): void {
        var iLast: number[] = indexListLast;
        var iCurr: number[] = indexListCurr;
        var changeState: string = "none";
        var objLast: TbrCore.MenuItem | undefined;
        var objCurr: TbrCore.MenuItem | undefined;

        var getObjLast = function(): TbrCore.MenuItem {
            if (iLast.length == 0) return {};
            objLast = { submenu: _this.lastMenu };
            var i;
            for (i = 0; i < iLast.length; i++) {
                var menuParent = objLast;
                try {
                    objLast = (objLast.submenu as TbrCore.MenuItem[])[iLast[i]];
                } catch (e) {
                    console.error("Failed to retrieve comparison item from old template at indexes: " + iLast);
                    console.log({ lastTemplate: _this.lastMenu, currentTemplate: _this.currMenu });
                }
                if (objLast)
                    objLast.menuParent = menuParent;
            }
            if (objLast && ((!objLast.label && !objLast.type) || objLast.visible === false)) { // Remove faulty menu items and invisible entries
                ((objLast.menuParent as TbrCore.MenuItem).submenu as TbrCore.MenuItem[]).splice(iLast[--i], 1);
                return getObjLast();
            }
            return objLast;
        }
        var getObjCurr = function(): TbrCore.MenuItem {
            if (iCurr.length == 0) return {};
            objCurr = { submenu: _this.currMenu };
            var i;
            for (i = 0; i < iCurr.length; i++) {
                var menuParent = objCurr;
                objCurr = (objCurr.submenu as TbrCore.MenuItem[])[iCurr[i]];
                if (objCurr)
                    objCurr.menuParent = menuParent;
            }
            if (objCurr && ((!objCurr.label && !objCurr.type) || objCurr.visible === false)) { // Remove faulty menu items and invisible entries
                ((objCurr.menuParent as TbrCore.MenuItem).submenu as TbrCore.MenuItem[]).splice(iCurr[--i], 1);
                return getObjCurr();
            }
            return objCurr;
        }

        var lastEnd = false;
        var currEnd = false;
        var spliceIndexLists = function() {
            var lastSubEnd = false;
            var currSubEnd = false;

            if (!(objLast = getObjLast())) {
                lastSubEnd = true;
                lastEnd = (iLast.length == 1);
            }
            if (!(objCurr = getObjCurr())) {
                currSubEnd = true;
                currEnd = (iCurr.length == 1);
            }

            if (lastSubEnd && currSubEnd) {
                iLast.splice(iLast.length - 1);
                iLast[iLast.length - 1]++;
                iCurr.splice(iCurr.length - 1);
                iCurr[iCurr.length - 1]++;
                spliceIndexLists();
            }
        }
        spliceIndexLists();

        if (lastEnd && currEnd) {
            this.titleBarReplacerView.setCurrentTemplate(this.currMenu);
            return; // End traversal
        }

        // Determine type of change: none, addition, removal
        loop: do {
            var lastIdentifier;
            var currIdentifier;

            if (objLast && objLast.command)
                lastIdentifier = objLast.command;
            else if (objLast)
                lastIdentifier = objLast.label;
            if (objCurr && objCurr.command)
                currIdentifier = objCurr.command;
            else if (objCurr)
                currIdentifier = objCurr.label;

            if (objLast && objCurr && lastIdentifier == currIdentifier) {
                changeState = "none";
                break;
            }
            if (!objLast && objCurr) {
                changeState = "addition";
                break;
            }
            if (objLast && !objCurr) {
                changeState = "removal";
                break;
            }

            if (objCurr && objCurr.menuParent && objCurr.menuParent.submenu) {
                for (var i = iCurr[iCurr.length - 1] + 1; i < objCurr.menuParent.submenu.length; i++) {
                    var o = objCurr.menuParent.submenu[i];
                    var oIdentifier = o.command ? o.command : o.label;
                    if (objLast && lastIdentifier == oIdentifier) {
                        changeState = "addition";
                        break loop;
                    }
                }
            }

            if (objLast && objCurr && lastIdentifier != currIdentifier)
                changeState = "removal";

        } while (false);

        switch(changeState) {

            case "none":
                if (!(objCurr as TbrCore.MenuItem).label) { // Exception for separators
                    iLast[iLast.length - 1]++;
                    iCurr[iCurr.length - 1]++;
                    break;
                }
                this.updateLabel(iCurr, (objCurr as TbrCore.MenuItem).label as string);
                if ((objLast as TbrCore.MenuItem).submenu) {
                    iLast.push(0);
                    iCurr.push(0);
                } else {
                    iLast[iLast.length - 1]++;
                    iCurr[iCurr.length - 1]++;
                }
                break;

            case "addition":
                this.buildAdditions(objCurr, iCurr);
                iCurr[iCurr.length - 1]++;
                break;

            case "removal":
                this.cleanUp(iCurr);
                iLast[iLast.length - 1]++;
                break;

        }

        this.traverseTemplate(iLast, iCurr); // Recurse

    }

    getItemFromIndex(indexList: number[]) {
        var o = document.querySelector(".app-menu");
        if (!o) return o;
        o = o.children[indexList[0]];
        for (var i = 1; i < indexList.length; i++) {
            try {
                o = o.getElementsByClassName("menu-box")[0].children[indexList[i]];
            } catch (e) {
                console.error("Failed to retrieve menu box from indexes: " + indexList)
                console.log({ lastTemplate: _this.lastMenu, currentTemplate: _this.currMenu });
            }
        }
        return o;
    }

    // Update label text
    updateLabel(indexList: number[], labelText: string) {
        var altData = this.formatAltKey(labelText);
        var o = this.getItemFromIndex(indexList);
        if (!o) return;
        var targetLength = 1;

        if (indexList.length > 1) {
            o = <Element> o.firstChild; // Exception for everything that isn't category labels
            targetLength = 0;
        }
        while (o.childNodes.length > targetLength) {
            (o.childNodes[0] as any).remove();
        }
        if (labelText == "VERSION")
            altData.html = "Version " + (atom as any).appVersion;
        o.insertAdjacentHTML("afterbegin", altData.html);
    }

    // Build and insert new menu items
    buildAdditions(template: any, indexList: number[]) {
        if (indexList.length == 1) {
            this.titleBarReplacerView.deserializeLabel(template, indexList[0]);
        }
        else {
            var temp = (document.querySelector(".title-bar-replacer .app-menu") as Element)
                .children[indexList[0]]
                .getElementsByClassName("menu-box")[0];
            for (var i = 1; i < indexList.length - 1; i++) {
                temp = Array.prototype.filter.call(temp.children, function(node: Element) {
                    if (!node.classList.contains("menu-item"))
                        return false;
                    else return true;
                })[indexList[i]];
                temp = temp.getElementsByClassName("menu-box")[0];
            }
            var traversed = this.titleBarReplacerView.traverseTemplate([template]);
            temp.insertBefore(traversed[0], temp.children[indexList[indexList.length - 1]]);
            this.titleBarReplacerView.initMenuItem(traversed[0], temp as HTMLElement);
        }
    }

    // Remove menu items that are no longer present
    cleanUp(indexList: number[]) {
        var o = this.getItemFromIndex(indexList);
        if (o && o.parentNode) o.parentNode.removeChild(o);
    }

    formatAltKey(string: string) {
        var key: any = string.match(/&./);
        if (key == null) {
            return { html: string, name: string, key: null }
        }
        key = this.removeAmp(key[0]);
        var html = string.replace("&" + key, "<u>" + key + "</u>");
        return { html: html, name: this.removeAmp(string), key: key.toLowerCase() };
    }
    removeAmp(string: string) {
        return string.replace("&", "");
    }

}
