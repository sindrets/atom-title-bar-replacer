export class CssUtils {
    public static defaultId = "tbr-style";

    public static createStyleSheet(id = CssUtils.defaultId, domClass?: string): CSSStyleSheet {
        const style = document.createElement("style");
        style.id = id.replace(/[.#]/, "");

        if (domClass) {
            style.classList.add(domClass);
        }

        style.appendChild(document.createTextNode(""));

        if (document.head) {
            document.head.appendChild(style);
        }

        return style.sheet as CSSStyleSheet;
    }

    public static styleExists(selector = `#${CssUtils.defaultId}`): boolean {
        return document.querySelector(selector) !== null;
    }

    public static getStyleSheet(
        selector = `#${CssUtils.defaultId}`,
        domClass?: string
    ): CSSStyleSheet | null {
        if (!this.styleExists(selector)) return this.createStyleSheet(selector, domClass);

        let query = selector;

        if (domClass) {
            query += "." + domClass;
        }

        let result = document.querySelector(query) as HTMLStyleElement;
        let sheet: CSSStyleSheet | null = null;

        if (result) {
            sheet = result.sheet as CSSStyleSheet;
        }

        return sheet;
    }

    public static clearRule(selector: string, id = `#${CssUtils.defaultId}`) {
        const sheet = this.getStyleSheet(id);
        if (!sheet) {
            return;
        }

        for (let i = 0; i < sheet.cssRules.length; i++) {
            if ((<CSSStyleRule>sheet.cssRules[i]).selectorText == selector) {
                sheet.removeRule(i);
            }
        }
        return sheet;
    }
}
