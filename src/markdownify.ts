import TurndownService from "turndown"

const validTags: Record<string, boolean> = {
    'p': true,
    'h1': true,
    'h2': true,
    'h3': true,
    'h4': true,
    'h5': true,
    'img': true,
    'a': true,
    'em': true,
    'strong': true,
    'ul': true,
    'ol': true,
    'li': true,
    'br': true,
    'sup': true,
    'sub': true,
    '#text': true
}

const validAttributes: Record<string, Record<string, boolean>> = {
    img: {
        'src': true,
        'alt': true
    },
    a: {
        'href': true
    }
}

export function isMarkdownElement(el: any): boolean {
    const name = el.localName || el.nodeName;
    if (!validTags[name]) {
        return false;
    }

    if (el.attributes) {
        for (const attr of el.attributes) {
            if (!validAttributes[name]?.[attr.nodeName]) {
                return false;
            }
        }
    }

    for (let i = 0; i < el.children.length; i++) {
        const childEl = el.children[i];
        if (!isMarkdownElement(childEl)) {
            return false;
        }
    }

    return true;
}

export function convertHtmlToMarkdown(html: string, turndownOptions: Record<string, any> = {}) {
    return new TurndownService({
        headingStyle: 'atx',
        ...turndownOptions
    }).turndown(html);
}

export function mergeSubsequentMarkdownBlocks(children: Record<string,any>[]): any[] {
    const merged: Record<string,any>[] = [];
    let pendingWhitespace = null;
    children.forEach((block) => {
        const lastBlock = merged[merged.length - 1];
        if (lastBlock?.type === 'markdown') {
            if (block.type === 'whitespace') {
                pendingWhitespace = block;
                return
            }

            if (block.type === 'markdown') {
                const blockKey = Object.keys(block.data)[0];
                const currentValue = block.data[blockKey].value;

                const lastBlockKey = Object.keys(lastBlock.data)[0];
                lastBlock.data[lastBlockKey].value += `\n\n${currentValue}`
                pendingWhitespace = null;
                return;
            }
        }

        if (pendingWhitespace) {
            merged.push(pendingWhitespace)
            pendingWhitespace = null;
        }

        merged.push(block);
    });

    if (pendingWhitespace) {
        merged.push(pendingWhitespace)
    }

    return merged;
}