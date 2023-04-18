function getElementSignature(el, depth: number) : string {
    if (depth <= 0) {
        return '';
    }

    if (el.id) {
        return `#${el.id}`;
    }

    const classList = el.attributes.getNamedItem('class')?.value || ''
    const childSignatures = []
    for (let i = 0; i < el.children.length; i++) {
        const childEl = el.children[i];
        const childSelector = getElementSignature(childEl, depth - 1);

        if (childSelector) {
            childSignatures.push(childSelector);
        }
    }

    const signature = `${el.localName}${classList ? `.${classList.split(' ').join('.')}`: ''}${childSignatures.length ? `.${childSignatures.join('\n')}`: ''}`;

    return signature;
}

export function doesElementHaveRepeatingChildren(el): boolean {
    if (el.children.length <= 1) {
        return false;
    }

    if (el.localName === 'svg' || el.localName === 'path' || el.localName === 'g') {
        return false;
    }

    const firstSelector = getElementSignature(el.children[0], 6);
    for (let i = 1; i < el.children.length; i++) {
        const childEl = el.children[i];

        const nextSelector = getElementSignature(childEl, 6);

        if (nextSelector !== firstSelector) {
            return false;
        }
    }

    return true;
}