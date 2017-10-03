'use babel'

import TitleBarReplacerView from "./title-bar-replacer-view.js";

var _this: null;

export default class MenuUpdater {

    titleBarReplacerView: null;
    lastMenu: null;
    currMenu: null;

    constructor(titleBarReplacerView) {
        _this = this;
        this.titleBarReplacerView = titleBarReplacerView;
    }

    run() {
        this.lastMenu = this.titleBarReplacerView.getCurrentTemplate().slice(0);
        this.currMenu = null;
        this.currMenu = JSON.parse(JSON.stringify(atom.menu.template)); // Deep clone menu template

        // Sort packages alphabetically
        var alphabeticalSort = (function(a, b) {
            var nameA = a.label.toLowerCase(),
                nameB = b.label.toLowerCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        });
        for (var i = 0; i < this.lastMenu.length; i++) {
            if (this.lastMenu[i].label == "&Packages") {
                this.lastMenu[i].submenu.sort(alphabeticalSort);
            }
        }
        for (var i = 0; i < this.currMenu.length; i++) {
            if (this.currMenu[i].label == "&Packages") {
                this.currMenu[i].submenu.sort(alphabeticalSort);
            }
        }

        var iLast = [0];
        var iCurr = [0];
        this.traverseTemplate(iLast, iCurr);

    }

    //Compare current menu template to the previous template and make necessary changes
    traverseTemplate(indexListLast, indexListCurr) {
        var iLast = indexListLast;
        var iCurr = indexListCurr;
        var changeState = "none";
        var objLast;
        var objCurr;

        var getObjLast = function() {
            if (iLast.length == 0) return 1;
            objLast = { submenu: _this.lastMenu };
            var i;
            for (i = 0; i < iLast.length; i++) {
                var menuParent = objLast;
                try {
                    objLast = objLast.submenu[iLast[i]];
                } catch (e) {
                    console.error("Failed to retrieve comparison item from old template at indexes: " + iLast);
                    console.log({ lastTemplate: _this.lastMenu, currentTemplate: _this.currMenu });
                }
                if (objLast)
                    objLast.menuParent = menuParent;
            }
            if (objLast && ((!objLast.label && !objLast.type) || objLast.visible === false)) { // Remove faulty menu items and invisible entries
                objLast.menuParent.submenu.splice(iLast[--i], 1);
                return getObjLast();
            }
            return objLast;
        }
        var getObjCurr = function() {
            if (iCurr.length == 0) return 1;
            objCurr = { submenu: _this.currMenu };
            var i;
            for (i = 0; i < iCurr.length; i++) {
                var menuParent = objCurr;
                objCurr = objCurr.submenu[iCurr[i]];
                if (objCurr)
                    objCurr.menuParent = menuParent;
            }
            if (objCurr && ((!objCurr.label && !objCurr.type) || objCurr.visible === false)) { // Remove faulty menu items and invisible entries
                objCurr.menuParent.submenu.splice(iCurr[--i], 1);
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

            for (var i = iCurr[iCurr.length - 1] + 1; i < objCurr.menuParent.submenu.length; i++) {
                var o = objCurr.menuParent.submenu[i];
                var oIdentifier = o.command ? o.command : o.label;
                if (objLast && lastIdentifier == oIdentifier) {
                    changeState = "addition";
                    break loop;
                }
            }

            if (objLast && objCurr && lastIdentifier != currIdentifier)
                changeState = "removal";

        } while (false);

        switch(changeState) {

            case "none":
                if (!objCurr.label) { // Exception for separators
                    iLast[iLast.length - 1]++;
                    iCurr[iCurr.length - 1]++;
                    break;
                }
                this.updateLabel(iCurr, objCurr.label);
                if (objLast.submenu) {
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

    getItemFromIndex(indexList) {
        var o = document.querySelector(".app-menu");
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
    updateLabel(indexList, labelText) {
        var altData = this.formatAltKey(labelText);
        var o = this.getItemFromIndex(indexList);
        var targetLength = 1;

        if (indexList.length > 1) {
            o = o.firstChild; // Exception for everything that isn't category labels
            targetLength = 0;
        }
        while (o.childNodes.length > targetLength) {
            o.childNodes[0].remove();
        }
        if (labelText == "VERSION")
            altData.html = "Version " + atom.appVersion;
        o.insertAdjacentHTML("afterbegin", altData.html);
    }

    // Build and insert new menu items
    buildAdditions(template, indexList) {
        if (indexList.length == 1) {
            this.titleBarReplacerView.deserializeLabel(template, indexList[0]);
        }
        else {
            var temp = document.querySelector(".title-bar-replacer .app-menu")
                .children[indexList[0]]
                .getElementsByClassName("menu-box")[0];
            for (var i = 1; i < indexList.length - 1; i++) {
                temp = Array.prototype.filter.call(temp.children, function(node) {
                    if (!node.classList.contains("menu-item"))
                        return false;
                    else return true;
                })[indexList[i]];
                temp = temp.getElementsByClassName("menu-box")[0];
            }
            var traversed = this.titleBarReplacerView.traverseTemplate([template]);
            temp.insertBefore(traversed[0], temp.children[indexList[indexList.length - 1]]);
            this.titleBarReplacerView.initMenuItem(traversed[0], temp);
        }
    }

    // Remove menu items that are no longer present
    cleanUp(indexList) {
        var o = this.getItemFromIndex(indexList);
        o.parentNode.removeChild(o);
    }

    formatAltKey(string) {
        var key = string.match(/&./);
        if (key == null) {
            return { html: string, name: string, key: null }
        }
        key = this.removeAmp(key[0]);
        var html = string.replace("&" + key, "<u>" + key + "</u>");
        return { html: html, name: this.removeAmp(string), key: key.toLowerCase() };
    }
    removeAmp(string) {
        return string.replace("&", "");
    }

}
