import { TitleBarReplacerView } from "./TitleBarReplacerView";
import { CssUtils } from "./CssUtils";
import { titleBarStyle, windowControlThemes, themeCssSelectors, Color } from "./types";
import { Utils } from "./Utils";

export class ThemeManager {
    private view: TitleBarReplacerView;
    private style?: { cssId: string };
    private controlTheme?: { cssClass: string };

    constructor(view: TitleBarReplacerView) {
        this.view = view;
    }

    public setTitleBarStyle(style: string): void {
        const newStyle = titleBarStyle[style];
        if (!newStyle) {
            return;
        }

        if (this.style) {
            this.view.getElement().classList.remove(this.style.cssId);
        }

        this.view.getElement().classList.add(newStyle.cssId);
        this.style = newStyle;
    }

    public setWindowControlTheme(theme: string): void {
        const newTheme = windowControlThemes[theme];
        if (!newTheme) {
            return;
        }

        if (this.controlTheme) {
            this.view.getElement().classList.remove(this.controlTheme.cssClass);
        }

        this.view.getElement().classList.add(newTheme.cssClass);
        this.controlTheme = newTheme;
    }

    public setReverseWindowControls(flag: boolean): void {
        Utils.setToggleClass(this.view.getElement(), "reverse-controls", flag);
    }

    public static getLuminance(color: Color): number {
        // Calculate the 'y' of the YIQ color model
        let y = (color.red * 299 + color.green * 587 + color.blue * 114) / 1000;
        return y / 255;
    }

    public static shadeColor(color: Color, frac: number): Color {
        const t = frac < 0 ? 0 : 255;
        const p = frac < 0 ? frac * -1 : frac;

        // @ts-ignore
        return new color.constructor(
            Math.round((t - color.red) * p) + color.red,
            Math.round((t - color.green) * p) + color.green,
            Math.round((t - color.blue) * p) + color.blue,
            color.alpha
        );
    }

    public static clearCustomColors(): void {
        themeCssSelectors.base.forEach((selector) => {
            CssUtils.clearRule(selector);
        });
        themeCssSelectors.hi.forEach((selector) => {
            CssUtils.clearRule(selector);
        });
        themeCssSelectors.txt.forEach((selector) => {
            CssUtils.clearRule(selector);
        });
    }

    public static applyCustomColors(): void {
        const sheet = CssUtils.getStyleSheet();
        if (!sheet) {
            return;
        }

        const colorBase = atom.config.get("title-bar-replacer.colors.baseColor") as Color;
        const colorHi = atom.config.get("title-bar-replacer.colors.highlightColor") as Color;
        const colorText = atom.config.get("title-bar-replacer.colors.textColor") as Color;

        ThemeManager.clearCustomColors();

        let factor = ThemeManager.getLuminance(colorBase) >= 0.5 ? -1 : 1;
        sheet.insertRule(
            themeCssSelectors.base[0] +
                "{ background-color: " +
                colorBase.toHexString() +
                " !important }",
            sheet.cssRules.length
        );
        sheet.insertRule(
            themeCssSelectors.base[1] +
                "{ background-color: " +
                ThemeManager.shadeColor(colorBase, -0.4 * factor).toHexString() +
                " !important }",
            sheet.cssRules.length
        );
        sheet.insertRule(
            themeCssSelectors.base[2] +
                "{ background-color: " +
                ThemeManager.shadeColor(colorBase, 0.1 * factor).toHexString() +
                " !important }",
            sheet.cssRules.length
        );

        sheet.insertRule(
            themeCssSelectors.hi[0] +
                "{ background-color: " +
                colorHi.toHexString() +
                " !important }",
            sheet.cssRules.length
        );

        factor = ThemeManager.getLuminance(colorText) >= 0.5 ? -1 : 1;
        sheet.insertRule(
            themeCssSelectors.txt[0] + "{ color: " + colorText.toHexString() + " !important }",
            sheet.cssRules.length
        );
        sheet.insertRule(
            themeCssSelectors.txt[1] +
                "{ color: " +
                ThemeManager.shadeColor(colorText, 0.25 * factor).toHexString() +
                " !important }",
            sheet.cssRules.length
        );
        sheet.insertRule(
            themeCssSelectors.txt[2] +
                "{ color: " +
                ThemeManager.shadeColor(colorText, -0.4 * factor).toHexString() +
                " !important }",
            sheet.cssRules.length
        );
    }
}
