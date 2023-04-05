import { Link as TipTapLink } from '@tiptap/extension-link';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { getAttributes, markInputRule, markPasteRule } from '@tiptap/core';

const inputRegex = /(?:^|\s)\[(.+?)]\(.+?\)$/g;
const srcInputRegex = /\[.+?]\((.+?)\)/;

export const Link = TipTapLink.extend({
	addOptions() {
		return {
			...this.parent?.(),
			openOnClick: false,
		};
	},
	addProseMirrorPlugins() {
		const plugins: Plugin[] = this.parent?.() || [];

		const ctrlClickHandler = new Plugin({
			key: new PluginKey('handleClick'),
			props: {
				handleClick(view, _, event) {
					const attrs = getAttributes(view.state, 'link');
					const link = (event.target as HTMLElement)?.closest('a');

					const keyPressed = event.ctrlKey || event.metaKey;

					if (keyPressed && link && attrs.href) {
						window.open(attrs.href, attrs.target, 'noopener,noreferrer');

						return true;
					}

					return false;
				},
			},
		});

		plugins.push(ctrlClickHandler);

		return plugins;
	},

	addInputRules() {
		return [
			markInputRule({
				find: inputRegex,
				type: this.type,
				getAttributes: (match) => {
					// match again since markInputRule assumes the last group is the text content
					return {
						href: match.input?.match(srcInputRegex)?.[1],
					};
				},
			}),
		];
	},

	addPasteRules() {
		return [
			...(this.parent?.() ?? []),
			markPasteRule({
				find: inputRegex,
				type: this.type,
				getAttributes: (match) => {
					// match again since markInputRule assumes the last group is the text content
					return {
						href: match.input?.match(srcInputRegex)?.[1],
					};
				},
			}),
		];
	},

	addKeyboardShortcuts() {
		return {
			Space: ({ editor }) => {
				if (editor.isActive('link')) {
					const { $to } = editor.state.selection;
					const atEnd = $to.parentOffset === $to.parent.content.size;
					if (
						atEnd ||
						!$to.doc
							.resolve($to.pos + 1)
							.marks()
							.some((mark) => mark.type === this.type)
					) {
						// remove link mark if at end of node or the next position does not have the link mark set (at the end of the link)
						editor.view.dispatch(editor.state.tr.removeStoredMark(this.type));
					}
				}
				return false;
			},
		};
	},
});

export default Link;
