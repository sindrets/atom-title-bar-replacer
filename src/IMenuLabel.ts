import { IMenuItem } from "./IMenuItem";

export interface IMenuLabel {
    label: string;
    submenu: IMenuItem[];
}
