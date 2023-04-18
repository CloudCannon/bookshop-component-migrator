import test, {ExecutionContext} from 'ava';
import { isMarkdownElement, convertHtmlToMarkdown } from "../src/markdownify";
import { getDomNode } from "./helpers/dom";

function isTextMarkdownElement(html: string) {
    return isMarkdownElement(getDomNode(html));
}

test("Markdownify negative checks", (t: ExecutionContext) => {
    const tests: Array<string> = [
        '<div><p>test</p></div>',
        '<p class="test">test</p>',
        '<p><a href="https://example.com" target="_blank">Test</a></p>',
        '<span>test</span>',
        '<p>test <span>test</span></p>',
    ]

    tests.forEach((text) => {
        t.true(!isTextMarkdownElement(text), `"${text}" should not be markdownified`);
    });
});

test("Markdownify positive checks", (t: ExecutionContext) => {
    const tests: Array<string> = [
        '<p>test</p>',
        '<h1>test</h1>',
        '<p><a href="https://example.com">Test</a></p>',
    ]

    tests.forEach((text) => {
        t.true(!!isTextMarkdownElement(text), `"${text}" should be markdownified`);
    });
});

test("Markdownify positive conversions", (t: ExecutionContext) => {
    t.is(convertHtmlToMarkdown('<p>test</p>'), 'test')
    t.is(convertHtmlToMarkdown('<h1>test</h1><p>test</p>'), '# test\n\ntest')
    t.is(convertHtmlToMarkdown('<h1>test</h1>'), '# test')
});

test("Markdownify throws", (t: ExecutionContext) => {
    t.throws(() => isTextMarkdownElement('<p>test</p><p>test</p>'))
});