import { $createTextNode, LexicalNode, NodeKey, SerializedTextNode, TextNode } from 'lexical';

export default class LabelNode extends TextNode {
	__className;
	__text;

	constructor(text: string, className: string, key?: NodeKey) {
		super(text, key);
		this.__className = className;
	}
	static getType() {
		return 'label-node'
	}

	static clone(node) {
		return new LabelNode(node.__className, node.__text)
	}

	createDOM(config) {
		const element = super.createDOM(config)
		return element;
	}

	updateDOM() {
		return false;
	}

	exportJSON(): SerializedTextNode {
		return {
			...super.exportJSON(),
			type: 'label-node',
		};
	}

	importJSON(jsonNode: SerializedTextNode): LexicalNode {
		const { text } = jsonNode;
		const node = $createTextNode(text)
		return node;
	}
}