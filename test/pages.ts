import * as fs from 'fs/promises';
import test, { ExecutionContext } from 'ava';
import { parse } from 'yaml';
import { getDom, getDomNode } from "./helpers/dom";

import { parseComponent } from '../src/component-reader';
import { LiquidTemplateEngine } from '../src/template-engine';

function buildLiquidComponent(html:string) : Record<string, any> {
    const parsed = parseComponent(getDomNode(html));
    const templateEngine = new LiquidTemplateEngine(parsed.id, parsed.component, parsed.data);
    return templateEngine.render();
}

export function parsePage(html: string, componentSelector: string) : Record<string, any> {
    const document = getDom(html);
    const components = document.querySelectorAll(componentSelector);

    const outputComponents: any[] = []
    const pageData: any[] = [];

    for (let i = 0; i < components.length; i++) {
        const el = components[i];

        try {
          const {
            component,
            bookshop,
            data
          } = buildLiquidComponent(el.outerHTML) || {};

          pageData.push({
            _bookshop_name: bookshop.spec.label,
            ...data
          });

          outputComponents.push({
            component,
            bookshop,
          })
        } catch (error) {
          console.warn('Failed to parse component', el.outerHTML)
          console.warn(error.message)
        }
    }

    return {
        outputComponents,
        pageData
    }
}

const pages = ['basic']

async function readTextFile(path: string): Promise<string> {
  return (await fs.readFile(path)).toString('utf-8');
}

pages.forEach((pageName) => {
  test(`${pageName} component`, async (t: ExecutionContext) => {
    const html = await readTextFile(`./test/fixtures/pages/${pageName}/index.html`);
    const config: any = parse(await readTextFile(`./test/fixtures/pages/${pageName}/config.yml`));

    const {
      outputComponents,
      pageData
    } = parsePage(html, config.component_selector)

    t.true(JSON.stringify(outputComponents).indexOf('@@') < 0, 'components contain internal uuid refs')
    t.true(JSON.stringify(pageData).indexOf('@@') < 0, 'page data contains internal uuid refs')
  });
})