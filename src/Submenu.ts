import { MenuItem } from "./MenuItem";
import { Utils } from "./Utils";

export class Submenu extends Array<MenuItem> {
    public getSelected(): MenuItem | null {
        let result: MenuItem | null = null;

        this.some((o) => {
            if (o.isSelected()) {
                result = o;
                return true;
            }
            return false;
        });

        return result;
    }

    public getSelectable(): MenuItem[] {
        return this.filter((o) => {
            return o.isEnabled() && o.isVisible() && !o.isSeparator();
        });
    }

    public selectFirstItem() {
        const selectable = this.getSelectable();
        if (selectable.length < 1) {
            return;
        }
        this.getSelected()?.setSelected(false);
        selectable[0].setSelected(true);
    }

    public selectLastItem() {
        const selectable = this.getSelectable();
        if (selectable.length < 1) {
            return;
        }
        this.getSelected()?.setSelected(false);
        selectable[selectable.length - 1].setSelected(true);
    }

    public selectNextItem() {
        const selectable = this.getSelectable();
        if (selectable.length <= 1) {
            return;
        }

        const selected = this.getSelected();
        if (selected) {
            let i = selectable.indexOf(selected);
            selected.setSelected(false);
            selectable[Utils.mod(i + 1, selectable.length)].setSelected(true);
        }
    }

    public selectPreviousItem() {
        const selectable = this.getSelectable();
        if (selectable.length <= 1) {
            return;
        }

        const selected = this.getSelected();
        if (selected) {
            let i = selectable.indexOf(selected);
            selected.setSelected(false);
            selectable[Utils.mod(i - 1, selectable.length)].setSelected(true);
        }
    }

    public countSelectable(): number {
        let c = 0;
        this.forEach((o) => {
            if (o.isEnabled() && o.isVisible() && !o.isSeparator()) {
                c++;
            }
        });

        return c;
    }
}
