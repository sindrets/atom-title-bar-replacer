import { ApplicationMenu } from "./ApplicationMenu";
import { MenuItem } from "./MenuItem";
import { MenuLabel } from "./MenuLabel";
import { IMenuItem, IMenuLabel, MenuLike, TMenuLike } from "./types";
import { Diff, EditToken } from "./Diff";

export class MenuUpdater {
    public static run(appMenu: ApplicationMenu): number {
        const template: Partial<IMenuLabel>[] = JSON.parse(
            JSON.stringify((atom.menu as any).template)
        );

        if (!(template instanceof Array)) {
            console.error("MenuUpdater: Menu template is malformed! Cannot perform menu update.");
            return 0;
        }

        template.some((o) => {
            if (o.label === "&Packages") {
                o.submenu?.sort((a, b) => {
                    if (a.label !== undefined && b.label !== undefined) {
                        const aL = a.label.toLowerCase(),
                            bL = b.label.toLowerCase();
                        if (aL < bL) return -1;
                        if (aL > bL) return 1;
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
    ) {
        let edits = 0;
        const diff = new Diff<typeof a[0], typeof b[0]>(a, b, MenuUpdater.equals);
        const editscript = diff.createEditScript();
        edits += MenuUpdater.execEditScript(parent, a, b, editscript);

        a.forEach((o, i) => {
            const aSub = o.getSubmenu(),
                bSub = b[i].submenu;
            if (aSub !== undefined) {
                if (!(bSub instanceof Array)) {
                    console.error("MenuUpdater: malformed menu template item!", b[i]);
                    return;
                }
                edits += MenuUpdater.recurse(o, aSub, bSub);
            }
        });

        return edits;
    }

    private static execEditScript(
        parent: ApplicationMenu | MenuLike,
        a: MenuLike[],
        b: Partial<TMenuLike>[],
        script: EditToken[]
    ): number {
        let ai = 0,
            bi = 0,
            edits = script.length;
        script.forEach((opr) => {
            switch (opr) {
                case EditToken.NOOP:
                    ai++, bi++;
                    edits--;
                    return;

                case EditToken.DELETE:
                    if (parent instanceof ApplicationMenu) {
                        parent.removeLabel(ai);
                    } else {
                        parent.removeChild(ai);
                    }
                    break;

                case EditToken.INSERT:
                    if (parent instanceof ApplicationMenu) {
                        let newItem = MenuLabel.createMenuLabel(b[bi] as IMenuLabel);
                        parent.insertLabel(newItem, ai++);
                    } else {
                        let newItem = MenuItem.createMenuItem(b[bi] as IMenuItem);
                        parent.insertChild(newItem, ai++);
                    }
                    bi++;
                    break;

                case EditToken.REPLACE:
                    if (parent instanceof ApplicationMenu) {
                        parent.removeLabel(ai);
                        let newItem = MenuLabel.createMenuLabel(b[bi] as IMenuLabel);
                        parent.insertLabel(newItem, ai++);
                    } else {
                        parent.removeChild(ai);
                        let newItem = MenuItem.createMenuItem(b[bi] as IMenuItem);
                        parent.insertChild(newItem, ai++);
                    }
                    break;
            }
        });

        return edits;
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
