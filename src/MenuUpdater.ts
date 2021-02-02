import { ApplicationMenu } from "./ApplicationMenu";
import { MenuItem } from "./MenuItem";
import { MenuLabel } from "./MenuLabel";
import { IMenuItem, IMenuLabel, MenuLike, TMenuLike } from "./types";

export class MenuUpdater {
    public static run(appMenu: ApplicationMenu): void {
        const template: Partial<IMenuLabel>[] = JSON.parse(
            JSON.stringify((atom.menu as any).template)
        );

        if (!(template instanceof Array)) {
            return;
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
    }

    private static recurse(parent: ApplicationMenu | MenuLike, a: MenuLike[], b: TMenuLike[]): void {
        let ai: number = 0, bi: number = 0;
    }

    private static equals(a: MenuLike, b: Partial<TMenuLike>): boolean {
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
