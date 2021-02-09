import { IAltKeyData } from "./types";

export class Utils {
    public static formatAltKey(label: string): IAltKeyData {
        const m = label.match(/(?<=&)./);
        const key = m ? m[0] : null;
        const html = label.replace(`&${key}`, `<u>${key}</u>`);
        return { html, name: label.replace("&", ""), key: key?.toLowerCase() || null };
    }

    public static setToggleClass(elmnt: HTMLElement, clazz: string, flag: boolean): void {
        flag ? elmnt.classList.add(clazz) : elmnt.classList.remove(clazz);
    }

    public static mod(n: number, m: number): number {
        return ((n % m) + m) % m;
    }

    public static clamp(v: number, min: number, max: number): number {
        if (v < min) return min;
        if (v > max) return max;
        return v;
    }

    public static stopEvent(e: Event): void {
        e.stopPropagation();
        e.preventDefault();
    }

    public static rangeIntersects(min0: number, max0: number, min1: number, max1: number): boolean {
        return (
            Math.max(min0, max0) >= Math.min(min1, max1) &&
            Math.min(min0, max0) <= Math.max(min1, max1)
        );
    }

    public static domRectIntersects(a: DOMRect, b: DOMRect): boolean {
        return (
            Utils.rangeIntersects(a.x, a.x + a.width, b.x, b.x + b.width) &&
            Utils.rangeIntersects(a.y, a.y + a.height, b.y, b.y + b.height)
        );
    }
}
