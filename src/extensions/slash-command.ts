import { PRIORITY_SLASH_COMMAND } from '@/constants';
import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';

export const SlashCommand = Extension.create({
	name: 'slashCommand',
	// make sure the key handlers always get priority
	priority: PRIORITY_SLASH_COMMAND,

	addOptions() {
		return {
			suggestion: {
				char: '/',
				startOfLine: false,
				allowSpaces: true,
				allowedPrefixes: null,
				command: ({ editor, range, props }) => {
					props.command({ editor, range });
				},
			},
		};
	},

	addProseMirrorPlugins() {
		return [
			Suggestion({
				editor: this.editor,
				...this.options.suggestion,
			}),
		];
	},
});

export default SlashCommand;
