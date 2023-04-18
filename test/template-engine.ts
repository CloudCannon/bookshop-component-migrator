import test, {ExecutionContext} from 'ava';
import { TemplateEngine } from "../src/template-engine";

test("Ensure throws", (t: ExecutionContext) => {
   const templateEngine = new TemplateEngine('test', 'test', {});

	t.throws(() => templateEngine.markdownBlock('_id'));
	t.throws(() => templateEngine.loop('_id', '_arrayKey', '_innerComponent'));
	t.throws(() => templateEngine.objectPrefixNotation('_id'));
	t.throws(() => templateEngine.outputVariable('_id'));
});