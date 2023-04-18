import { isMarkdownElement, convertHtmlToMarkdown, mergeSubsequentMarkdownBlocks } from "./markdownify";
import { getTextAndSurroundingWhitespace } from './text-helpers';
import { doesElementHaveRepeatingChildren } from './repeating-blocks'
import { editableAttrs } from "./template-engine";

export function getComponentId(el: any) {
    return el.id || 'unknown';
}

export function getUuid() {
	return `@@xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx@@`.replace(/[xy]/g, (c) => {
		const r = Math.random() * 16 | 0; const
			// eslint-disable-next-line no-bitwise, no-mixed-operators
			v = c === 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

function matchRepeatingBlockKeys(data, idealData): Record<string, any> {
    const expectedKeys = Object.keys(idealData);
    const actualKeys = Object.keys(data);
    const newData: Record<string, any> = {};
    for (let i = 0; i < expectedKeys.length; i++) {
        const expectedKey = expectedKeys[i];
        const actualKey = actualKeys[i];
        if (idealData[expectedKey].type === 'array') {
            newData[expectedKey] = {
                ...idealData[expectedKey],
                value: data[actualKey].value.map(
                    (value, index) => matchRepeatingBlockKeys(value, idealData[expectedKey].value[index])
                )
            };
        } else {
            newData[expectedKey] = data[actualKey];
        }
    }
    return newData;
}

const selfClosingTags: Record<string, boolean> = {
    area: true,
    base: true,
    br: true,
    col: true,
    command: true,
    embed: true,
    hr: true,
    img: true,
    input: true,
    keygen: true,
    link: true,
    meta: true,
    param: true,
    source: true,
    track: true,
    wbr: true,
};

function formatElementAttributes(el: any, data: Record<string, any>, templateContents: boolean) {
    const attrs: string[] = [];
    for (const attr of el.attributes) {
        let value = attr.value;
        const editableSettings = editableAttrs[attr.name];
        if (editableSettings && templateContents) {
            const dataId = getUuid();
            data[dataId] = {
                value,
                type: 'attribute',
                element: el.localName,
                attribute: attr.name
            };
            value = dataId;
        }
        attrs.push(`${attr.name}="${value}"`);
    }

    if (attrs.length === 0) {
        return '';
    }
    return ` ${attrs.join(' ')}`;
}

function formatElement(el: any, innerContent: string, data: Record<string, any>, templateContents: boolean) : string {
    const attrs:string = formatElementAttributes(el, data, templateContents);
    if (selfClosingTags[el.localName]) {
        return `<${el.localName}${attrs} />`;
    }
    return `<${el.localName}${attrs}>${innerContent}</${el.localName}>`;
}

export function parseDomNode(node: any, templateContents: boolean): Record<string, any> {
    const data: Record<string, any> = {};

    if (node.nodeName === '#text') {
        if (!/^[\n|\s]*$/.test(node.textContent)) {
            if (templateContents) {
                const {
                    prefix, 
                    content, 
                    suffix
                } = getTextAndSurroundingWhitespace(node.textContent);
    
                if (content) {
                    const dataId = getUuid();
                    data[dataId] = {
                        type: 'text',
                        value: content.replace(/[\s\n]+/g, ' ')
                    };
                    const component = `${prefix || ''}${dataId}${suffix || ''}`;
                    return {
                        type: 'text',
                        component,
                        data
                    };
                }
            }

            return {
                type: 'raw-text',
                component: node.textContent,
                data
            };
        }

        return {
            type: 'whitespace',
            component: node.textContent,
            data
        };
    }

    if (node.nodeName.startsWith('#')) {
        return {
            type: `ignored:${node.nodeName}`,
            component: '',
            data
        };
    }
    const el = node as Element;
    if (!selfClosingTags[el.localName] && isMarkdownElement(el) && templateContents) {
        const children = Object.values(el.childNodes).map((childNode: any) => parseDomNode(childNode, false))
        const innerHTML: string[] = children.map((block) => block?.component || '');
        const outerHTML = formatElement(el, innerHTML.join(''), data, false);
        const {
            prefix, 
            content: markdownHTML, 
            suffix
        } = getTextAndSurroundingWhitespace(outerHTML);
        const markdown = convertHtmlToMarkdown(prefix + markdownHTML);
        const dataId = getUuid();
        data[dataId] = {
            type: 'markdown',
            value: markdown
        };
        return {
            type: `markdown`,
            element: el.localName,
            component: `${dataId}${suffix}`,
            data
        };
    }

    const children = Object.values(el.childNodes).map((childNode: any) => parseDomNode(childNode, templateContents))
    if (doesElementHaveRepeatingChildren(el)) {
        const values: any[] = [];

        const first = children.find((block) => block.type !== 'whitespace');
        children.forEach((block) => {
            if (block.type === 'whitespace') {
                return;
            }

            block.data = matchRepeatingBlockKeys(block.data, first?.data);
            values.push(block.data);
        });

        const dataId = getUuid();
        data[dataId] = {
            type: 'array',
            value: values,
            id: getUuid(),
            component: first?.component || ''
        };

        const prefix = children[0].type === 'whitespace'
            ? children[0].component : '';
        const suffix = children[children.length - 1].type === 'whitespace'
            ? children[children.length - 1].component : '';

        return {
            type: `loop`,
            component: formatElement(el, `${prefix}${dataId}${suffix}`, data, templateContents),
            data
        };
    }


    const innerHTML: string[] = []
    const processed: Record<string, any>[] = mergeSubsequentMarkdownBlocks(children);
    
    processed.forEach((block) => {
        innerHTML.push(block.component);
        Object.keys(block.data).forEach((key) => {
            data[key] = block.data[key];
        });
    });

    return {
        type: `element:${el.localName}`,
        component: formatElement(el, innerHTML.join(''), data, templateContents),
        data
    };
}

export function parseComponent(el: any) : Record<string, any> {
    const parsed = parseDomNode(el, true);
    const id: string = getComponentId(el);
    return {
        id,
        ...parsed
    }
}
