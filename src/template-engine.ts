export const editableAttrs: Record<string, Record<string, string>> = {
    'href': {
        suffix: '_url'
    },
    'img.src': {
        suffix: '_image'
    },
    'src': {
        suffix: '_url'
    },
    'alt': {
        suffix: '_alt'
    },
    'title': {
        suffix: '_title'
    }
}

const idTypeSuffixes: Record<string, string> = {
	array: '_list',
	markdown: '_markdown'
};

export class TemplateEngine {
	id: string;
	component: string;
	data: Record<string, any>;

	constructor(id: string, component: string, data: Record<string, any>) {
		this.id = id;
		this.component = component;
		this.data = data;
	}

	render(providedKeys: Record<string, string> = {}) {
		const bookshop: Record<string, any> = {};
		bookshop.spec = {
			label: this.id,
			description: '',
			icon: 'nature_people',
			structures: ["content_blocks"],
			tags: []
		};
	
		bookshop.blueprint = {};
		bookshop._inputs = {};
	
		const data: Record<string, any> = {};
		const keyToIdLookup: Record<string, string> = {
			...providedKeys
		};

		let count = 0;
		let component = this.component;
		const getCodeId = (dataRef: Record<string, any>, key: string, prefix: string) : string => {
			if (!keyToIdLookup[key]) {
				const editableAttr = editableAttrs[`${dataRef.element}${dataRef.attribute}`]
					|| editableAttrs[dataRef.attribute];
	
				const suffix = editableAttr?.suffix || idTypeSuffixes[dataRef.type] || '';
	
				keyToIdLookup[key] = `${count++}${suffix}`;
			}
			return `${prefix}${keyToIdLookup[key]}`;
		}
		
		const replaceUuids = (dataRefs: Record<string, any>, key: string, prefix: string, parents: string[], blueprint, inputs): string => {
			const dataRef = dataRefs[key];

			const id = getCodeId(dataRef, key, prefix);
			const rootId = id.substring(prefix.length);
			if (dataRef.type === 'array') {
				const newParents = [...parents, rootId];
				const arrayKey = `item_${parents.length}`;
				const innerComponent = dataRef.component;
				
				const spaceBeforeKey = component.match(new RegExp(`(\n?[\t| ]*)${key}`))?.[1] || '';
				component = component.replace(key, this.loop(id, arrayKey, innerComponent, spaceBeforeKey));

				const idLookup: Record<string, string> = {}
				const newPrefix = this.objectPrefixNotation(arrayKey);
				Object.keys(dataRef.value[0]).forEach((key) => {
					const childInputs = {}
					const lookupId = replaceUuids(dataRef.value[0], key, newPrefix, newParents, {}, childInputs)
					idLookup[key] = lookupId;
					Object.keys(childInputs).forEach((childId) => {
						const selector = [rootId, childId].join('.')
						inputs[selector] = childInputs[childId];
					});
				});
		
				blueprint[rootId] = dataRef.value.map((entry: Record<string, any>) => {
					const childBlueprint = {};
					Object.keys(entry).forEach((key) => replaceUuids(entry, key, newPrefix, newParents, childBlueprint, {}));
					return childBlueprint;
				});
				return rootId;
			}

			if (dataRef.type === 'markdown') {
				component = component.replace(key, this.markdownBlock(id))
				blueprint[rootId] = dataRef.value;
				inputs[rootId] = {
					type: 'markdown'
				};
				return rootId;
			}
			
			component = component.replace(key, this.outputVariable(id))
		
			blueprint[rootId] = dataRef.value;
			return rootId;
		};

		Object.keys(this.data).forEach((key) => replaceUuids(this.data, key, '', [], bookshop.blueprint, bookshop._inputs));

		return {
			bookshop,
			component,
			keyToIdLookup,
			data: { ...bookshop.blueprint }
		};
	}

	markdownBlock(_id: string) : string {
		throw new Error('Not yet implmented');
	}

	loop(_id: string, _arrayKey: string, _innerComponent: string, _whitespace: string) : string {
		throw new Error('Not yet implmented');
	}

	objectPrefixNotation(_id: string) : string {
		throw new Error('Not yet implmented');
	}

	outputVariable(_id: string) : string {
		throw new Error('Not yet implmented');
	}
}

export class LiquidTemplateEngine extends TemplateEngine {
	markdownBlock(id: string) {
		return `{{ ${id} | markdownify }}`
	}

	loop(id: string, arrayKey: string, innerComponent: string, whitespace: string) {
		return `{% for ${arrayKey} in ${id} %}${whitespace}${innerComponent}${whitespace}{% endfor %}`
	}

	objectPrefixNotation(id: string) {
		return `${id}.`
	}

	outputVariable(id: string) {
		return `{{ ${id} }}`;
	}
}

const prependInclude = (id: string) : string => {
	if(id.includes(".")) {
		return id;
	}
	return `include.${id}`;
}
export class JekyllTemplateEngine extends TemplateEngine {

	markdownBlock(id: string) {
		return `{{ ${prependInclude(id)} | markdownify }}`
	}

	loop(id: string, arrayKey: string, innerComponent: string, whitespace: string) {
		return `{% for ${arrayKey} in ${prependInclude(id)} %}${whitespace}${innerComponent}${whitespace}{% endfor %}`
	}

	objectPrefixNotation(id: string) {
		return `${id}.`
	}

	outputVariable(id: string) {
		return `{{ ${prependInclude(id)} }}`;
	}
}
export class GoTemplateEngine extends TemplateEngine {
	markdownBlock(id: string) {
		return `{{ .${id} | markdownify }}`
	}

	loop(id: string, _arrayKey: string, innerComponent: string, whitespace: string) {
		return `{{ range .${id} }}${whitespace}${innerComponent}${whitespace}{{ end }}`
	}

	objectPrefixNotation(_id: string) {
		return ''
	}

	outputVariable(id: string) {
		return `{{ .${id} }}`
	}
}

export const templateEngines = {
	liquid: LiquidTemplateEngine,
	go: GoTemplateEngine,
	jekyll: JekyllTemplateEngine
};