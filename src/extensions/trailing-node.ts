import { isLastBlockEmptyTopLevelParagraph } from '@/helpers/isLastBlockEmptyTopLevelParagraph';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

/**
 * Extension based on:
 * - https://github.com/ueberdosis/tiptap/blob/v1/packages/tiptap-extensions/src/extensions/TrailingNode.js
 * - https://github.com/remirror/remirror/blob/e0f1bec4a1e8073ce8f5500d62193e52321155b9/packages/prosemirror-trailing-node/src/trailing-node-plugin.ts
 */

export const TrailingNode = Extension.create({
	name: 'trailingNode',

	addProseMirrorPlugins() {
		const plugin = new PluginKey(this.name);

		return [
			new Plugin({
				key: plugin,
				appendTransaction: (_, __, state) => {
					const { doc, tr, schema } = state;
					const shouldInsertNodeAtEnd = plugin.getState(state);
					const endPosition = doc.content.size - 1;

					if (!shouldInsertNodeAtEnd) {
						return;
					}

					return tr.insert(endPosition, schema.nodes.paragraph!.create());
				},
				state: {
					init: (_, { tr }) => {
						return !isLastBlockEmptyTopLevelParagraph(tr.doc);
					},
					apply: (tr, value) => {
						if (!tr.docChanged) {
							return value;
						}
						return !isLastBlockEmptyTopLevelParagraph(tr.doc);
					},
				},
			}),
		];
	},
});

export default TrailingNode;
