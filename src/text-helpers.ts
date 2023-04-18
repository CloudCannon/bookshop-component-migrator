export function getLeadingWhitespace(text: string) : string {
    return text.match(/^[\s\n]*/)[0];
}

export function getTrailingWhitespace(text: string) : string {
    return text.match(/[\s\n]*$/)[0];
}

export function getTextAndSurroundingWhitespace(text: string) : Record<string, string> {
    if (text.match(/^\W*$/)) {
        return {
            prefix: text,
            suffix: '',
            content: ''
        }
    }
    const prefix = getLeadingWhitespace(text);
    const suffix = getTrailingWhitespace(text);
    const content = text.substring(prefix.length, text.length - suffix.length);

    return {
        prefix,
        suffix,
        content
    }
}
