import { TitleBarReplacer } from "./TitleBarReplacer";

export { config } from "./config";
export { ApplicationMenu } from "./ApplicationMenu";
export { MenuUpdater } from "./MenuUpdater";
export { Diff, EditToken } from "./Diff";

const titleBarReplacer = new TitleBarReplacer();

export async function activate(state: any) {
    titleBarReplacer.activate(state);
}

export function deactivate() {
    titleBarReplacer.deactivate();
}

export function serialize() {
    return titleBarReplacer.serialize();
}

export function deserialize(state: { data: any }) {
    console.log(state.data);
    titleBarReplacer.deserialize(state.data);
}
