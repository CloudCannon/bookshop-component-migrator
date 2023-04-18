import test, {ExecutionContext} from 'ava';
import { isMarkdownElement, convertHtmlToMarkdown, mergeSubsequentMarkdownBlocks } from "../src/markdownify";
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

test("Markdownify mergeSubsequentMarkdownBlocks", (t: ExecutionContext) => {
    const processed = mergeSubsequentMarkdownBlocks([
        {
                "type": "whitespace",
                "component": "\n\t\t",
                "data": {}
        },
        {
                "type": "markdown",
                "element": "h2",
                "component": "@@ab992523-8c1b-4013-8ffb-c78be26708ef@@",
                "data": {
                        "@@ab992523-8c1b-4013-8ffb-c78be26708ef@@": {
                                "type": "markdown",
                                "value": "## Some markdown content"
                        }
                }
        },
        {
                "type": "whitespace",
                "component": "\n\t\t",
                "data": {}
        },
        {
                "type": "markdown",
                "element": "p",
                "component": "@@2233e532-63d8-4719-b185-83370f3cb01c@@",
                "data": {
                        "@@2233e532-63d8-4719-b185-83370f3cb01c@@": {
                                "type": "markdown",
                                "value": "Which should markdownify the entire divs contents"
                        }
                }
        },
        {
                "type": "whitespace",
                "component": "\n\t",
                "data": {}
        }
    ]);

    t.deepEqual(processed, [
        {
                "type": "whitespace",
                "component": "\n\t\t",
                "data": {}
        },
        {
                "type": "markdown",
                "element": "h2",
                "component": "@@ab992523-8c1b-4013-8ffb-c78be26708ef@@",
                "data": {
                        "@@ab992523-8c1b-4013-8ffb-c78be26708ef@@": {
                                "type": "markdown",
                                "value": "## Some markdown content\n\nWhich should markdownify the entire divs contents"
                        }
                }
        },
        {
                "type": "whitespace",
                "component": "\n\t",
                "data": {}
        }
    ])
});

test("Markdownify mergeSubsequentMarkdownBlocks no merges", (t: ExecutionContext) => {
    const processed = mergeSubsequentMarkdownBlocks([
        {
                "type": "whitespace",
                "component": "\n\t\t\t",
                "data": {}
        },
        {
                "type": "element:h4",
                "component": "<h4 class=\"heading\">@@0d632532-5a15-4ec2-99ad-38b6dd74d1f9@@</h4>",
                "data": {
                        "@@0d632532-5a15-4ec2-99ad-38b6dd74d1f9@@": {
                                "type": "text",
                                "value": "Heading 1"
                        }
                }
        },
        {
                "type": "whitespace",
                "component": "\n\t\t\t",
                "data": {}
        },
        {
                "type": "markdown",
                "element": "p",
                "component": "@@f1ab55bc-de46-47e7-bc0a-0eeac94177a4@@",
                "data": {
                        "@@f1ab55bc-de46-47e7-bc0a-0eeac94177a4@@": {
                                "type": "markdown",
                                "value": "Markdown example 1"
                        }
                }
        },
        {
                "type": "whitespace",
                "component": "\n\t\t\t",
                "data": {}
        },
        {
                "type": "loop",
                "component": "<div>\n\t\t\t\t@@92e69052-d9de-46c6-afd3-1c11e138ca30@@\n\t\t\t</div>",
                "data": {
                        "@@92e69052-d9de-46c6-afd3-1c11e138ca30@@": {
                                "type": "array",
                                "value": [
                                        {
                                                "@@b70c430d-18aa-4bf2-9fa2-0167439b91e4@@": {
                                                        "type": "text",
                                                        "value": "1"
                                                },
                                                "@@f5a202f9-393c-4a75-aeba-4fc6654ef7c7@@": {
                                                        "value": "/1/",
                                                        "type": "attribute",
                                                        "element": "a",
                                                        "attribute": "href"
                                                }
                                        },
                                        {
                                                "@@b70c430d-18aa-4bf2-9fa2-0167439b91e4@@": {
                                                        "type": "text",
                                                        "value": "2"
                                                },
                                                "@@f5a202f9-393c-4a75-aeba-4fc6654ef7c7@@": {
                                                        "value": "/2/",
                                                        "type": "attribute",
                                                        "element": "a",
                                                        "attribute": "href"
                                                }
                                        }
                                ],
                                "id": "@@8264c656-947c-4e73-b4b5-6aff3c50fc3e@@",
                                "component": "<a class=\"link\" href=\"@@f5a202f9-393c-4a75-aeba-4fc6654ef7c7@@\">@@b70c430d-18aa-4bf2-9fa2-0167439b91e4@@</a>"
                        }
                }
        },
        {
                "type": "whitespace",
                "component": "\n\t\t",
                "data": {}
        }
    ]);

    t.deepEqual(processed, [
        {
                "type": "whitespace",
                "component": "\n\t\t\t",
                "data": {}
        },
        {
                "type": "element:h4",
                "component": "<h4 class=\"heading\">@@0d632532-5a15-4ec2-99ad-38b6dd74d1f9@@</h4>",
                "data": {
                        "@@0d632532-5a15-4ec2-99ad-38b6dd74d1f9@@": {
                                "type": "text",
                                "value": "Heading 1"
                        }
                }
        },
        {
                "type": "whitespace",
                "component": "\n\t\t\t",
                "data": {}
        },
        {
                "type": "markdown",
                "element": "p",
                "component": "@@f1ab55bc-de46-47e7-bc0a-0eeac94177a4@@",
                "data": {
                        "@@f1ab55bc-de46-47e7-bc0a-0eeac94177a4@@": {
                                "type": "markdown",
                                "value": "Markdown example 1"
                        }
                }
        },
        {
                "type": "whitespace",
                "component": "\n\t\t\t",
                "data": {}
        },
        {
                "type": "loop",
                "component": "<div>\n\t\t\t\t@@92e69052-d9de-46c6-afd3-1c11e138ca30@@\n\t\t\t</div>",
                "data": {
                        "@@92e69052-d9de-46c6-afd3-1c11e138ca30@@": {
                                "type": "array",
                                "value": [
                                        {
                                                "@@b70c430d-18aa-4bf2-9fa2-0167439b91e4@@": {
                                                        "type": "text",
                                                        "value": "1"
                                                },
                                                "@@f5a202f9-393c-4a75-aeba-4fc6654ef7c7@@": {
                                                        "value": "/1/",
                                                        "type": "attribute",
                                                        "element": "a",
                                                        "attribute": "href"
                                                }
                                        },
                                        {
                                                "@@b70c430d-18aa-4bf2-9fa2-0167439b91e4@@": {
                                                        "type": "text",
                                                        "value": "2"
                                                },
                                                "@@f5a202f9-393c-4a75-aeba-4fc6654ef7c7@@": {
                                                        "value": "/2/",
                                                        "type": "attribute",
                                                        "element": "a",
                                                        "attribute": "href"
                                                }
                                        }
                                ],
                                "id": "@@8264c656-947c-4e73-b4b5-6aff3c50fc3e@@",
                                "component": "<a class=\"link\" href=\"@@f5a202f9-393c-4a75-aeba-4fc6654ef7c7@@\">@@b70c430d-18aa-4bf2-9fa2-0167439b91e4@@</a>"
                        }
                }
        },
        {
                "type": "whitespace",
                "component": "\n\t\t",
                "data": {}
        }
    ])
});