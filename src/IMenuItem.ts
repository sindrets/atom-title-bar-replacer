export interface IMenuItem {
    label?: string;
    command?: string;
    commandDetail?: any;
    type?: "separator";
    enabled?: boolean;
    visible?: boolean;
    submenu: IMenuItem[];
}
