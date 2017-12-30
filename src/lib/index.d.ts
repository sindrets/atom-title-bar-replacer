

declare namespace TbrCore {

    /**
     * Menu item object from Atom's menu template
     */
    interface MenuItem {

        /** @type {string} Display name in the application menu. */
        label?: string;

        /** @type {MenuItem[]} Array of menu items contained in the submenu. */
        submenu?: MenuItem[];

        /** @type {string} Describes the menu item type. Possible values include: "separator", undefined */
        type?: string;

        /** @type {boolean} Determines the menu item visibility in the application menu. */
        visible?: boolean;

        /** @type {boolean} Determines whether or not commands will dispatch from this menu item. Disabled
         *                  menu items are visually dimmed.*/
        enabled?: boolean;

        /** @type {string} The command to be dispatched when this menu item is triggerd.
         *  @see AtomCore.CommandRegistry.dispatch */
        command?: string;

        /** @type {string} The command detail sent to the dispatch method when this menu item is triggered.
         *  @see AtomCore.CommandRegistry.dispatch */
        commandDetail?: string;

        /** @type {MenuItem} Property used by the MenuUpdater to refer to this menu item's parent submenu. */
        menuParent?: MenuItem;
    }

    /**
     * An object that contains the html for the menu label text, a plain-text label name, and the alt key that
     * triggers this menu item
     */
    interface AltKeyCommand {
        html: string;
        name: string;
        key: string | null;
    }

    interface MenuItemHTMLElement extends HTMLElement {
        command: string;
        commandDetail: string;
        ignoreHide: boolean;
    }

}
