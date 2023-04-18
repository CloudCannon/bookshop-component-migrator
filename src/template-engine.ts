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
		const getId = (dataRef: Record<string, any>, key: string, prefix: string) : string => {
			if (keyToIdLookup[key]) {
				return keyToIdLookup[key];
			}
			const editableAttr = editableAttrs[`${dataRef.element}${dataRef.attribute}`]
				|| editableAttrs[dataRef.attribute];

			const suffix = editableAttr?.suffix || idTypeSuffixes[dataRef.type] || '';

			const id = `${prefix}${count++}${suffix}`;
			keyToIdLookup[key] = id;
			return id;
		}
		
		const replaceUuids = (dataRefs: Record<string, any>, key: string, prefix: string, addToBluePrint: boolean): string => {
			const dataRef = dataRefs[key];

			const id = getId(dataRef, key, prefix);
			if (dataRef.type === 'array') {
				const arrayKey = 'item';
				const innerComponent = dataRef.component;
				component = component.replace(key, this.loop(id, arrayKey, innerComponent));

				const idLookup: Record<string, string> = {}

				Object.keys(dataRef.value[0]).forEach((key) => {
					const prefix = this.objectPrefixNotation(arrayKey);
					const childId = replaceUuids(dataRef.value[0], key, prefix, false)

					const rootId = childId.substring(prefix.length)
					idLookup[key] = rootId;

					if (dataRef.value[0][key].type === 'markdown') {
						bookshop._inputs[`${id}.${rootId}`] = {
							type: 'markdown'
						};
					}
				});
			
				data[id] = dataRef.value.map((entry: Record<string, any>) => {
					return Object.keys(entry).reduce((value: Record<string, any>, key: string) => {
						value[idLookup[key]] = entry[key].value;
						return value
					}, {});
				});

				bookshop.blueprint[id] = data[id];
				return id;
			}

			if (dataRef.type === 'markdown') {
				component = component.replace(key, this.markdownBlock(id))
				if (addToBluePrint) {
					data[id] = dataRef.value;
					bookshop._inputs[id] = {
						type: 'markdown'
					};
					bookshop.blueprint[id] = data[id];
				}
				return id;
			}
			
			component = component.replace(key, this.outputVariable(id))
		
			if (addToBluePrint) {
				data[id] = dataRef.value;
				bookshop.blueprint[id] = data[id];
			}
			return id;
		};

		Object.keys(this.data).forEach((key) => replaceUuids(this.data, key, '', true));

		return {
			bookshop,
			component,
			keyToIdLookup,
			data
		};
	}

	markdownBlock(_id: string) : string {
		throw new Error('Not yet implmented');
	}

	loop(_id: string, _arrayKey: string, _innerComponent: string) : string {
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

	loop(id: string, arrayKey: string, innerComponent: string) {
		return `{% for ${arrayKey} in ${id} %}\n\t\t${innerComponent}\n\t{% endfor %}`
	}

	objectPrefixNotation(id: string) {
		return `${id}.`
	}

	outputVariable(id: string) {
		return `{{ ${id} }}`;
	}
}
export class GoTemplateEngine extends TemplateEngine {
	markdownBlock(id: string) {
		return `{{ .${id} | markdownify }}`
	}

	loop(id: string, _arrayKey: string, innerComponent: string) {
		return `{{ range .${id} }}\n\t\t${innerComponent}\n\t{{ end }}`
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
	go: GoTemplateEngine
};