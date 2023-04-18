import * as fs from 'fs/promises';
import test from 'ava';
import { parse } from 'yaml';
import { parseComponent } from "../src/component-reader";
import { templateEngines, TemplateEngine } from "../src/template-engine";
import { getDomNode } from "./helpers/dom";

function getTemplateEngine(templateEngineName, id, component, data) : TemplateEngine {
  const TemplateEngineClass = templateEngines[templateEngineName];
  return new TemplateEngineClass(id, component, data);
}

function buildComponent(html:string, templateEngineName: string) : Record<string, any> {
  const el = getDomNode(html);
  const parsed = parseComponent(el);
  const templateEngine = getTemplateEngine(templateEngineName, parsed.id, parsed.component, parsed.data);
  return templateEngine.render();
}

async function readTextFile(path: string): Promise<string> {
  return (await fs.readFile(path)).toString('utf-8');
}

const components = [
  'simple',
  'section',
  'hero',
  'markdown-element',
  'markdown-with-formatting',
  'markdown-multielement',
  'left-right-block',
  'image-block',
  'repeating-links',
  'repeating-cards',
  'repeating-products',
  'repeating-products-reversed',
  'repeating-svgs'
]

components.forEach((componentName) => {
  test(`parseComponent ${componentName} component`, async (t) => {
    const inputHtml = await readTextFile(`./test/fixtures/components/${componentName}/input.html`);
    const expectedBookshop = await readTextFile(`./test/fixtures/components/${componentName}/bookshop.yml`);
    const templateEnginesNames = Object.keys(templateEngines);
    for (let i = 0; i < templateEnginesNames.length; i++) {
      const templateEngineName = templateEnginesNames[i];
      let expectedOutput;
      try {
        expectedOutput = await readTextFile(`./test/fixtures/components/${componentName}/component.${templateEngineName}`);
      } catch (err) {
        if (err.code === 'ENOENT') {
          t.log(`${componentName} has no ${templateEngineName} replacements test`)
          break;
        }
        throw err;
      }

      const { component, bookshop, data } = buildComponent(inputHtml, templateEngineName) || {};
      t.deepEqual((component || '').trim(), expectedOutput.trim());

      const parsed: Record<string, any> = parse(expectedBookshop) || {};
      t.deepEqual(bookshop?.spec, parsed.spec, 'spec parsed does not match expected');
      t.deepEqual(bookshop?._inputs, parsed._inputs, '_inputs parsed does not match expected');
      t.deepEqual(bookshop?.blueprint, parsed.blueprint, 'spec parsed does not match expected');
      t.is(JSON.stringify(data, null, 2), JSON.stringify(parsed.blueprint, null, 2), 'data parsed does not match expected');
  
    }

    let expectedReplacedLiquid, expectedReplacedBookshop;
    try {
      expectedReplacedLiquid = await readTextFile(`./test/fixtures/components/${componentName}/keys-replaced.component.liquid`);
      expectedReplacedBookshop = await readTextFile(`./test/fixtures/components/${componentName}/keys-replaced.bookshop.yml`);
    } catch (err) {
      if (err.code === 'ENOENT') {
        t.log(`${componentName} has no key replacements test`)
        return;
      }
      throw err;
    }
    const parsedBookshop: Record<string, any> = parse(expectedReplacedBookshop) || {};
    const el = getDomNode(inputHtml);
    const parsedComponent = parseComponent(el);
    const templateEngine = new templateEngines.liquid(parsedComponent.id, parsedComponent.component, parsedComponent.data);

    const uuids = Object.keys(parsedComponent.data);
    const expectedKeys = Object.keys(parsedBookshop.blueprint);
    const keyLookup = uuids.reduce((memo: Record<string, string>, uuid, index) => {
        memo[uuid] = expectedKeys[index];
        return memo;
    }, {})

    const {
      component: replacedComponent,
      bookshop: replacedBookshop,
      data: replacedData
    } = templateEngine.render(keyLookup) || {};
  
    t.deepEqual((replacedComponent || '').trim(), expectedReplacedLiquid.trim());
    t.deepEqual(replacedBookshop?.spec, parsedBookshop.spec, 'spec parsed does not match expected');
    t.deepEqual(replacedBookshop?._inputs, parsedBookshop._inputs, '_inputs parsed does not match expected');
    t.deepEqual(replacedBookshop?.blueprint, parsedBookshop.blueprint, 'spec parsed does not match expected');
    t.is(JSON.stringify(replacedData, null, 2), JSON.stringify(parsedBookshop.blueprint, null, 2), 'data parsed does not match expected');
  });
});