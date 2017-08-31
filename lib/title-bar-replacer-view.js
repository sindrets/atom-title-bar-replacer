'use babel';

$ = jQuery = require("jquery");
const remote = require('electron').remote;

var mainWindow = null;
var customMenu;

export default class TitleBarReplacerView {

    constructor(serializedState) {
        // Create root element
        this.element = document.createElement('div');
        this.element.classList.add('custom-title-bar');

        const titleSpan = document.createElement("span");
        titleSpan.classList.add("custom-title");
        var titleString;
        if ($("title")[0] != undefined)
            titleString = $("title")[0].innerHTML;
        else titleString = "Atom";
        titleSpan.innerHTML = titleString;
        this.element.appendChild(titleSpan);
        initTitleListener(titleSpan);

        const menuDiv = document.createElement('div');
        menuDiv.classList.add('menu-div');

        const minimize = document.createElement("i");
        minimize.textContent = "remove";
        minimize.classList.add("minimize", "material-icons");
        menuDiv.appendChild(minimize);

        const maximize = document.createElement("i");
        maximize.textContent = "web_asset";
        maximize.classList.add("maximize", "material-icons");
        menuDiv.appendChild(maximize);

        const customClose = document.createElement("i");
        customClose.textContent = "close";
        customClose.classList.add("custom-close", "material-icons");
        menuDiv.appendChild(customClose);

        this.element.appendChild(menuDiv);

        customMenu = document.createElement("div");
        customMenu.classList.add("custom-menu");
        this.element.appendChild(customMenu);

        this.element.isVisible = function() {
            return ($(".custom-title-bar").css("display") != "none");
        }
        this.element.isMenuVisible = function() {
            return ($(".custom-menu").css("display") != "none");
        }
    }

    spawnTemp() {
        spawnTempLabels(customMenu);
    }

    initMenuBar() {
        deserializeLabels(customMenu);
    }

    initButtons() {
        mainWindow = remote.getCurrentWindow();

        mainWindow.on("maximize", function() {
            $(".menu-div .maximize").html("filter_none");
            $(".menu-div .maximize").css("transform", "rotate(180deg)");
        });
        mainWindow.on("unmaximize", function() {
            $(".menu-div .maximize").html("web_asset");
            $(".menu-div .maximize").css("transform", "rotate(0deg)");
        });
        mainWindow.on("enter-full-screen", function() {
            $(".menu-div .maximize").addClass("disabled");
            if (atom.config.get("title-bar-replacer.general.hideFullscreenTitle")) {
                $(".custom-title-bar").addClass("no-title-bar");
            }
        });
        mainWindow.on("leave-full-screen", function() {
            $(".menu-div .maximize").removeClass("disabled");
            $(".custom-title-bar").removeClass("no-title-bar");
        });
        mainWindow.on("blur", function() {
            $(window).trigger("click");
        });

        $(".menu-div .custom-close").click(function() {
            mainWindow.close();
        });

        $(".menu-div .maximize").click(function() {
            if (!mainWindow.isMaximized()) {
                mainWindow.maximize();
                $(".menu-div .maximize").html("filter_none");
                $(".menu-div .maximize").css("transform", "rotate(180deg)");
            } else {
                mainWindow.unmaximize();
                $(".menu-div .maximize").html("web_asset");
                $(".menu-div .maximize").css("transform", "rotate(0deg)");
            }
        });

        $(".menu-div .minimize").click(function() {
            mainWindow.minimize();
        });

        if (mainWindow.isMaximized()) {
            $(".menu-div .maximize").html("filter_none");
            $(".menu-div .maximize").css("transform", "rotate(180deg)");
        }
    }

    updateMenu() {
        var customMenu = document.createElement("div");
        customMenu.classList.add("custom-menu");
        deserializeLabels(customMenu);
        $(".custom-menu").remove();
        $(".custom-title-bar")[0].appendChild(customMenu);
    }

    // Returns an object that can be retrieved when package is activated
    serialize() {}

    // Tear down any state and detach
    destroy() {
        this.element.remove();
    }

    getElement() {
        return this.element;
    }

}

//Spawn menu bar labels without traversing the menu template as this is not finished at this point
function spawnTempLabels(parent) {
    var commandTemp = atom.menu.packageManager.menuManager.template;

    for (var i = 0; i < commandTemp.length; i++) {

        if (!commandTemp[i].label) continue; //Prevent crash upon accessing faulty menu items

        var menuLabel = document.createElement("span");
        menuLabel.classList.add("menu-label");
        var labelString = formatAltKey(commandTemp[i].label).name;
        menuLabel.label = menuLabel.innerHTML = labelString;
        parent.appendChild(menuLabel);
    }
}

//Assemble each menu category and populate submenus
function deserializeLabels(parent) {
    var commandTemp = atom.menu.packageManager.menuManager.template;

    $(parent).empty();
    for (var i = 0; i < commandTemp.length; i++) {

        var menuLabel = document.createElement("span");
        menuLabel.classList.add("menu-label");
        var labelData = formatAltKey(commandTemp[i].label);
        menuLabel.label = labelData.name;
        menuLabel.altTrigger = labelData.key;
        menuLabel.innerHTML = labelData.html;

        var menu = document.createElement("div");
        menu.classList.add("menu-box");
        var traversed = traverseMenu(commandTemp[i].submenu);

        //Sort packages alphabetically
        if (labelData.name == "Packages") {
            traversed.sort(function(a, b) {
                var nameA = a.firstChild.innerHTML.toLowerCase(),
                    nameB = b.firstChild.innerHTML.toLowerCase();
                if (nameA < nameB) return -1;
                if (nameA > nameB) return 1;
                return 0;
            });
        }

        for (var j = 0; j < traversed.length; j++) {
            menu.appendChild(traversed[j]);
        }
        menuLabel.appendChild(menu);
        parent.appendChild(menuLabel);
    }
}

function formatAltKey(string) {
    var key = string.match(/&./);
    if (key == null) {
        return { html: string, name: string, key: null }
    }
    key = removeAmp(key[0]);
    var html = string.replace("&" + key, "<u>" + key + "</u>");
    return { html: html, name: removeAmp(string), key: key.toLowerCase() };
}
function removeAmp(string) {
    return string.replace("&", "");
}

//Recursively traverse the menu template and assemble the custom menu
function traverseMenu(menuArray) {
    var traversedElements = new Array();

    for (var i = 0; i < menuArray.length; i++) {
        if (menuArray[i].label == undefined && menuArray[i].type == "separator") {
            var separator = document.createElement("hr");
            traversedElements.push(separator);
            continue
        }

        if (menuArray[i].visible == false) continue;

        var menuItem = document.createElement("div");
        menuItem.classList.add("menu-item");
        if (menuArray[i].enabled == false)
            menuItem.classList.add("disabled");

        var altData = formatAltKey(menuArray[i].label);
        var s = altData.html;
        menuItem.altTrigger = altData.key;
        if (menuArray[i].label == "VERSION")
            s = "Version " + atom.appVersion;
        var menuItemName = document.createElement("span");
        menuItemName.classList.add("menu-item-name");
        menuItemName.innerHTML = s;

        var menuItemKeystroke = document.createElement("span");
        menuItemKeystroke.classList.add("menu-item-keystroke");

        menuItem.appendChild(menuItemName);
        menuItem.appendChild(menuItemKeystroke);

        if (menuArray[i].submenu != undefined) {
            menuItem.classList.add("has-sub");

            var menu = document.createElement("div");
            menu.classList.add("menu-box", "menu-item-submenu");

            var traversed = traverseMenu(menuArray[i].submenu);
            for (var j = 0; j < menuArray[i].submenu.length; j++) {
                if (traversed[j] == undefined) continue;
                menu.appendChild(traversed[j]);
            }
            menuItem.appendChild(menu);
        } else if (menuArray[i].command != undefined) {
            menuItem.command = menuArray[i].command;
            var s = atom.keymaps.findKeyBindings({
                command: menuItem.command
            });
            var keystroke;
            if (s.length > 1) {
                keystroke = getPlatformSpecificKeystroke(s);
            } else if (s.length > 0) {
                keystroke = s[0].keystrokes;
            }
            if (keystroke != undefined)
                menuItemKeystroke.innerHTML = keystroke;
        }
        traversedElements.push(menuItem);
    }
    return traversedElements;
}

function getPlatformKeystroke(keystrokeObj) {
    if (keystrokeObj.selector.includes("win32")) {
        return "win32";
    } else if (keystrokeObj.selector.includes("darwin")) {
        return "darwin";
    } else if (keystrokeObj.selector.includes("linux")) {
        return "linux";
    }
    return null;
}
//An attempt at getting the most relevant keystroke
function getPlatformSpecificKeystroke(keystrokeArray) {
    for (var i = 0; i < keystrokeArray.length; i++) {
        var platform = getPlatformKeystroke(keystrokeArray[i]);
        if (platform == process.platform) {
            return keystrokeArray[i].keystrokes;
        }
    }
    return keystrokeArray[0].keystrokes;
}

function initTitleListener(titleSpan) {

    setInterval(function() {
        var title = $("title")[0];
        if (title.innerHTML == undefined) return;

        var oldTitle = titleSpan.innerHTML;
        var newTitle = title.innerHTML;
        if (oldTitle != newTitle) {
            titleSpan.innerHTML = newTitle;
        }
    }, 200);
}
