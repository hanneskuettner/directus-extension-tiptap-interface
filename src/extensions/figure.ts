// extension based on https://github.com/ueberdosis/tiptap/blob/main/demos/src/Experiments/Figure/Vue/figure.ts

import { findChildrenInRange, mergeAttributes, Node, nodeInputRule, Tracker, Range } from '@tiptap/core';
import { VueNodeViewRenderer } from '@tiptap/vue-3';
import ImageNodeView from '../components/image-node-view.vue';
import { priorityHigher } from '../utils/priority';
import { PRIORITY_DOCUMENT_BLOCK } from '../constants';

export interface FigureOptions {
	HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		figure: {
			/**
			 * Add a figure element
			 */
			setFigure: (options: { src: string; alt?: string; title?: string; caption?: string }) => ReturnType;

			/**
			 * Converts an image to a figure
			 */
			imageToFigure: (options?: { range?: Range }) => ReturnType;

			/**
			 * Converts a figure to an image
			 */
			figureToImage: (options?: { range?: Range }) => ReturnType;
		};
	}
}

export const inputRegex = /!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\)/;

export const Figure = Node.create<FigureOptions>({
	name: 'figure',

	addOptions() {
		return {
			HTMLAttributes: {},
		};
	},

	group: 'block',

	content: 'inline*',

	draggable: false,
	isolating: true,
	priority: priorityHigher(PRIORITY_DOCUMENT_BLOCK),

	addAttributes() {
		return {
			src: {
				default: null,
				parseHTML: (element) => element.querySelector('img')?.getAttribute('src'),
			},

			alt: {
				default: null,
				parseHTML: (element) => element.querySelector('img')?.getAttribute('alt'),
			},

			title: {
				default: null,
				parseHTML: (element) => element.querySelector('img')?.getAttribute('title'),
			},

			id: {
				default: null,
				parseHTML: (element) => element.querySelector('img')?.getAttribute('data-directus-id'),
			},
		};
	},

	renderHTML({ HTMLAttributes }) {
		return ['vue-component', mergeAttributes(HTMLAttributes), 0];
	},

	parseHTML() {
		return [
			{
				tag: 'figure',
				contentElement: 'figcaption',
			},
		];
	},

	addKeyboardShortcuts() {
		const handleBackspace = () =>
			this.editor.commands.command(({ commands, tr }) => {
				const { selection } = tr;
				const { $head, empty } = selection;
				const isInFigure = $head.parent.type.name === this.name;
				const isAtStart = $head.parentOffset === 0;
				const nodeIsEmpty = $head.parent.content.size === 0;

				if (!empty || !isInFigure || !isAtStart || !nodeIsEmpty) {
					return false;
				}

				return commands.figureToImage();
			});

		const handleEnter = () =>
			this.editor.commands.command(({ commands, tr }) => {
				const { selection } = tr;
				const { $head, empty } = selection;

				if (!empty) {
					return false;
				}
			});

		return {
			Backspace: handleBackspace,
			Enter: handleEnter,
		};
	},

	addNodeView() {
		return VueNodeViewRenderer(ImageNodeView);
	},

	addCommands() {
		return {
			setFigure:
				({ caption, ...attrs }) =>
				({ chain }) => {
					return (
						chain()
							.insertContent({
								type: this.name,
								attrs,
								content: caption ? [{ type: 'text', text: caption }] : [],
							})
							// set cursor at end of caption field
							.command(({ tr, commands }) => {
								const { doc, selection } = tr;
								const position = doc.resolve(selection.to - 2).end();

								return commands.setTextSelection(position);
							})
							.run()
					);
				},

			imageToFigure:
				({ range } = {}) =>
				({ tr, commands }) => {
					const { doc, selection } = tr;
					const { from, to } = range ?? selection;
					const images = findChildrenInRange(doc, { from, to }, (node) => node.type.name === 'image');

					if (!images.length) {
						return false;
					}

					const tracker = new Tracker(tr);

					return commands.forEach(images, ({ node, pos }) => {
						const mapResult = tracker.map(pos);

						if (mapResult.deleted) {
							return false;
						}

						const range = {
							from: mapResult.position,
							to: mapResult.position + node.nodeSize,
						};

						return commands.insertContentAt(range, {
							type: this.name,
							attrs: node.attrs,
						});
					});
				},

			figureToImage:
				({ range } = {}) =>
				({ tr, commands }) => {
					const { doc, selection } = tr;
					const { from, to } = range ?? selection;
					const figures = findChildrenInRange(doc, { from, to }, (node) => node.type.name === this.name);

					if (!figures.length) {
						return false;
					}

					const tracker = new Tracker(tr);

					return commands.forEach(figures, ({ node, pos }) => {
						const mapResult = tracker.map(pos);

						if (mapResult.deleted) {
							return false;
						}

						const range = {
							from: mapResult.position,
							to: mapResult.position + node.nodeSize,
						};

						return commands.insertContentAt(range, {
							type: 'image',
							attrs: node.attrs,
						});
					});
				},
		};
	},

	addInputRules() {
		return [
			nodeInputRule({
				find: inputRegex,
				type: this.type,
				getAttributes: (match) => {
					const [, src, alt, title] = match;

					return { src, alt, title };
				},
			}),
		];
	},
});

export default Figure;
