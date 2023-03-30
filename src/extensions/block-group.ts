import { mergeAttributes, Node } from '@tiptap/core';

export const BlockGroup = Node.create({
	name: 'blockGroup',
	group: 'blockGroup',
	content: 'docBlock+',

	addOptions() {
		return {
			HTMLAttributes: {},
		};
	},

	parseHTML() {
		return [{ tag: 'div[data-type="block-group"]' }];
	},

	renderHTML({ HTMLAttributes }) {
		return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'block-group' }), 0];
	},
});

export default BlockGroup;
