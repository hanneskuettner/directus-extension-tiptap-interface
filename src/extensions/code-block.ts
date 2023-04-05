import CodeBlockNodeView from '@/components/node-views/node-view-code-block.vue';
import { PRIORITY_DOCUMENT_BLOCK } from '@/constants';
import { getHighlightLanguages } from '@/helpers/getHighlightLanguages';
import { priorityHigher } from '@/utils/priority';
import { textblockTypeInputRule } from '@tiptap/core';
import { backtickInputRegex, tildeInputRegex } from '@tiptap/extension-code-block';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { Attributes, VueNodeViewRenderer } from '@tiptap/vue-3';
import { get } from 'lodash-es';

export const CodeBlock = CodeBlockLowlight.extend({
	priority: priorityHigher(PRIORITY_DOCUMENT_BLOCK),

	group: 'blockWithoutChildren',

	addAttributes() {
		const attrs = this.parent?.() as Attributes;
		const { aliases } = getHighlightLanguages();
		return {
			language: {
				...attrs.language,
				default: this.options.defaultLanguage,
				parseHTML: (element) => {
					const langOrAlias = attrs.language?.parseHTML?.(element);
					return aliases[langOrAlias] ?? langOrAlias;
				},
			},
		};
	},

	addNodeView() {
		return VueNodeViewRenderer(CodeBlockNodeView);
	},

	addKeyboardShortcuts() {
		return {
			...(this.parent?.() ?? {}),
			Tab: () => {
				if (this.editor.isActive('codeBlock')) {
					return this.editor.commands.insertContent('\t');
				}
				return false;
			},
		};
	},

	addInputRules() {
		const { aliases } = getHighlightLanguages();
		return [
			textblockTypeInputRule({
				find: backtickInputRegex,
				type: this.type,
				getAttributes: (match) => ({
					language: get(aliases, match[1], match[1]),
				}),
			}),
			textblockTypeInputRule({
				find: tildeInputRegex,
				type: this.type,
				getAttributes: (match) => ({
					language: get(aliases, match[1], match[1]),
				}),
			}),
		];
	},
});

export default CodeBlock;
