import { Editor, Extension } from '@tiptap/core';
import { Node as ProsemirrorNode } from '@tiptap/pm/model';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

// Extension modified from https://github.com/ueberdosis/tiptap/blob/develop/packages/extension-placeholder/src/placeholder.ts

interface PlaceholderProps {
	editor: Editor;
	node: ProsemirrorNode;
	pos: number;
	hasAnchor: boolean;
}

export interface PlaceholderOptions {
	emptyEditorClass: string;
	emptyNodeClass: string;
	placeholder: ((PlaceholderProps: PlaceholderProps) => string) | string;
	showOnlyWhenEditable: boolean;
	showOnlyCurrent: ((PlaceholderProps: PlaceholderProps) => boolean) | boolean;
	includeChildren: ((PlaceholderProps: PlaceholderProps) => boolean) | boolean;
}

export const Placeholder = Extension.create<PlaceholderOptions>({
	name: 'placeholder',

	addOptions() {
		return {
			emptyEditorClass: 'is-editor-empty',
			emptyNodeClass: 'is-empty',
			placeholder: 'Write something …',
			showOnlyWhenEditable: true,
			showOnlyCurrent: true,
			includeChildren: false,
		};
	},

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey('placeholder'),
				props: {
					decorations: ({ doc, selection }) => {
						const active = this.editor.isEditable || !this.options.showOnlyWhenEditable;
						const { anchor } = selection;
						const decorations: Decoration[] = [];

						if (!active) {
							return null;
						}

						// only calculate isEmpty once due to its performance impacts (see issue #3360)
						const emptyDocInstance = doc.type.createAndFill();
						const isEditorEmpty =
							emptyDocInstance?.sameMarkup(doc) && emptyDocInstance.content.findDiffStart(doc.content) === null;

						doc.descendants((node, pos) => {
							const hasAnchor = anchor >= pos && anchor <= pos + node.nodeSize;
							const isEmpty = !node.isLeaf && !node.childCount;
							const props = {
								editor: this.editor,
								node,
								pos,
								hasAnchor,
							};

							const showOnlyCurrent =
								typeof this.options.showOnlyCurrent === 'function'
									? this.options.showOnlyCurrent(props)
									: this.options.showOnlyCurrent;

							if ((hasAnchor || !showOnlyCurrent) && isEmpty) {
								const classes = [this.options.emptyNodeClass];

								if (isEditorEmpty) {
									classes.push(this.options.emptyEditorClass);
								}

								const decoration = Decoration.node(pos, pos + node.nodeSize, {
									class: classes.join(' '),
									'data-placeholder':
										typeof this.options.placeholder === 'function'
											? this.options.placeholder(props)
											: this.options.placeholder,
								});

								decorations.push(decoration);
							}

							return typeof this.options.includeChildren === 'function'
								? this.options.includeChildren(props)
								: this.options.includeChildren;
						});

						return DecorationSet.create(doc, decorations);
					},
				},
			}),
		];
	},
});

export default Placeholder;
