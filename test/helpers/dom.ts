import { JSDOM } from "jsdom";

export function getDom(html: string) {
    const dom = new JSDOM(html);
    return dom.window.document;
}

export function getDomNode(html: string) {
    const frag = JSDOM.fragment(html);
    if (frag.children.length > 1) {
        throw new Error('fragment has more than one child')
    }
    return frag.children[0];
}
