import test, {ExecutionContext} from 'ava';
import { getTextAndSurroundingWhitespace, getLeadingWhitespace, getTrailingWhitespace } from "../src/text-helpers";

test("getTextAndSurroundingWhitespace a checks", (t: ExecutionContext) => {
    const tests: Array<string> = [
        ' a',
        'a ',
        ' a ',
        'a'
    ]

    tests.forEach((text) => {
        const {
            prefix,
            content,
            suffix
        } = getTextAndSurroundingWhitespace(text);
        t.is(content, 'a');
        t.is(`${prefix}${content}${suffix}`, text);
    });
});

test("getLeadingWhitespace checks", (t: ExecutionContext) => {
    t.is(getLeadingWhitespace('a'), '');
    t.is(getLeadingWhitespace(' a'), ' ');
    t.is(getLeadingWhitespace('  a'), '  ');
});

test("getTrailingWhitespace checks", (t: ExecutionContext) => {
    t.is(getTrailingWhitespace('a'), '');
    t.is(getTrailingWhitespace('a '), ' ');
    t.is(getTrailingWhitespace('a  '), '  ');
});

test("getTextAndSurroundingWhitespace empty checks", (t: ExecutionContext) => {
    const tests: Array<string> = [
        '',
        ' ',
        '  ',
        '   '
    ]

    tests.forEach((text) => {
        const {
            prefix,
            content,
            suffix
        } = getTextAndSurroundingWhitespace(text);
        t.is(`${prefix}${content}${suffix}`, text, `empty ${text.length} length string`);
    });
});