import { IAltKeyData } from "./IAltKeyData";

export class Utils {
    public static formatAltKey(label: string): IAltKeyData {
        const m = label.match(/(?<=&)./);
        const key = m ? m[0] : null;
        const html = label.replace(`&${key}`, `<u>${key}</u>`);
        return { html, name: label.replace("&", ""), key: key?.toLowerCase() || null };
    }
}
