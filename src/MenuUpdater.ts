import { ApplicationMenu } from "./ApplicationMenu";
import { MenuItem } from "./MenuItem";
import { MenuLabel } from "./MenuLabel";
import { IMenuItem, IMenuLabel, MenuLike, TMenuLike } from "./types";

export enum ChangeType {
    NONE,
    REMOVAL,
    ADDITION
}

export class MenuUpdater {
    public static run(appMenu: ApplicationMenu): ChangeType {
        console.info("MenuUpdater: running...");
        const template: Partial<IMenuLabel>[] = JSON.parse(
            JSON.stringify((atom.menu as any).template)
        );

        if (!(template instanceof Array)) {
            return ChangeType.NONE;
        }

        template.some((o) => {
            if (o.label === "&Packages") {
                o.submenu?.sort((a, b) => {
                    if (a.label !== undefined && b.label !== undefined) {
                        if (a.label < b.label) return -1;
                        if (a.label > b.label) return 1;
                    }
                    return 0;
                });
                return true;
            }
            return false;
        });

        return MenuUpdater.recurse(appMenu, appMenu.getLabels(), template);
    }

    private static recurse(
        parent: ApplicationMenu | MenuLike,
        a: MenuLike[],
        b: Partial<TMenuLike>[]
    ): ChangeType {
        let change = ChangeType.NONE;
        let ai: number = 0,
            bi: number = 0;

        for (; bi < b.length; ai++, bi++) {
            if (MenuUpdater.equals(a[ai], b[bi])) {
                const aSub = a[ai].getSubmenu(), bSub = b[bi].submenu;
                if (aSub !== undefined) {
                    if (!(bSub instanceof Array)) {
                        console.error("MenuUpdater: malformed menu template item!", b[bi]);
                        continue;
                    }
                    change = Math.max(change, this.recurse(a[ai], aSub, bSub));
                }
                continue;
            }

            let [arr, aj, bj]: [any[], number, number] = MenuUpdater.getRemoveable(a, b, ai, bi);
            if (arr.length > 0) {
                (arr as MenuLike[]).forEach((o) => {
                    if (parent instanceof ApplicationMenu) {
                        parent.removeLabel(o as MenuLabel);
                    } else {
                        parent.removeChild(o as MenuItem);
                    }
                });
                change = Math.max(change, ChangeType.REMOVAL);
                continue;
            }

            [arr, aj, bj] = MenuUpdater.getAdditions(a, b, ai, bi);
            if (arr.length > 0) {
                (arr as TMenuLike[]).forEach((o) => {
                    if (parent instanceof ApplicationMenu) {
                        let newItem = MenuLabel.createMenuLabel(o as IMenuLabel);
                        parent.insertLabel(newItem, ai++);
                    } else {
                        let newItem = MenuItem.createMenuItem(o as IMenuItem);
                        parent.insertChild(newItem, ai++);
                    }
                });
                bi = bj;
                change = ChangeType.ADDITION;
            }
        }

        return change;
    }

    private static getRemoveable(
        a: MenuLike[],
        b: Partial<TMenuLike>[],
        ai: number,
        bi: number
    ): [MenuLike[], number, number] {
        const arr: MenuLike[] = [];

        for (; ai < a.length; ai++) {
            if (MenuUpdater.equals(a[ai], b[bi])) {
                break;
            }
            arr.push(a[ai]);
        }

        return [arr, ai, bi];
    }

    private static getAdditions(
        a: MenuLike[],
        b: Partial<TMenuLike>[],
        ai: number,
        bi: number
    ): [Partial<TMenuLike>[], number, number] {
        const arr: Partial<TMenuLike>[] = [];

        for (; bi < b.length; bi++) {
            if (MenuUpdater.equals(a[ai], b[bi])) {
                break;
            }
            arr.push(b[bi]);
        }

        return [arr, ai, bi];
    }

    private static equals(a: MenuLike | undefined, b: Partial<TMenuLike> | undefined): boolean {
        if (a === undefined || b === undefined) {
            return false;
        }

        if (a instanceof MenuLabel) {
            return a.getLabelText() === b.label;
        }

        if (a instanceof MenuItem) {
            if (a.isSeparator()) {
                return (b as IMenuItem).type === "separator";
            }
            if (a.getCommand() !== undefined) {
                return a.getCommand() === (b as IMenuItem).command;
            }
            return a.getLabelText() === (b as IMenuItem).label;
        }

        return false;
    }
}
