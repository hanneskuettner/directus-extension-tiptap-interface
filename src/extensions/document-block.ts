import { Node, mergeAttributes, selectionToInsertionEnd } from '@tiptap/core';
import { TextSelection, Selection } from '@tiptap/pm/state';
import { Fragment, Node as ProseMirrorNode, ResolvedPos } from '@tiptap/pm/model';
import { VueNodeViewRenderer } from '@tiptap/vue-3';
import DocumentBlockNodeView from '../components/document-block-node-view.vue';
import { BlockInfo, getBlockInfoFromPos, getBlockInfoFromResolvedPos } from '../utils/block-info';

function isAtBlockStart($pos: ResolvedPos, $block?: ResolvedPos | null) {
	$block = $block ?? getBlockInfoFromResolvedPos($pos)?.$block;
	if (!$block) return false;

	return $pos.pos === $block.pos + $pos.depth - $block.depth;
}

function getPreviousBlock(doc: ProseMirrorNode, pos: number, predicate?: (blockInfo: BlockInfo) => boolean) {
	const startBlock = getBlockInfoFromPos(doc, pos);
	let blockInfo = startBlock;

	if (!blockInfo || !startBlock) return undefined;
	// finds the nearest previous block that
	//  - is a leaf (nestedBlockCount === 0)
	//  - is not the start block and
	//  - matches the predicate if given one
	do {
		if (blockInfo.nestedBlockCount === 0 && blockInfo.pos !== startBlock.pos && (!predicate || predicate(blockInfo))) {
			break;
		}
		pos--;
		blockInfo = getBlockInfoFromPos(doc, pos);
	} while (blockInfo);

	return blockInfo;
}

interface CreateBlockOptions {
	content?: Fragment | ProseMirrorNode | readonly ProseMirrorNode[] | null;
	updateSelection?: boolean;
}

export interface DocumentBlockOptions {
	ignoreKeysIn: string[];
}

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		block: {
			createBlockAbove: (options?: CreateBlockOptions) => ReturnType;
			createBlockBelow: (options?: CreateBlockOptions) => ReturnType;
			convertBlockToDefaultState: (options?: { skip?: string[] }) => ReturnType;
		};
	}
}

export const DocumentBlock = Node.create<DocumentBlockOptions>({
	name: 'docBlock',
	group: 'docBlock',
	content: 'block blockGroup*',
	draggable: true,
	selectable: false,
	defining: true,
	priority: 200,

	addOptions() {
		return {
			ignoreKeysIn: [],
			HTMLAttributes: {},
		};
	},

	parseHTML() {
		return [{ tag: 'div[data-type="doc-block"]' }];
	},

	renderHTML({ HTMLAttributes }) {
		return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'doc-block' }), 0];
	},

	addNodeView() {
		return VueNodeViewRenderer(DocumentBlockNodeView);
	},

	addKeyboardShortcuts() {
		const handleBackspace = () =>
			this.editor.commands.first(({ commands }) => [
				() => commands.deleteSelection(),
				() => commands.undoInputRule(),
				// maybe convert the block back to its default state (a paragraph)
				() => commands.convertBlockToDefaultState(),
				// removes a level of nesting if the block is indented if the selection is at the start of the block.
				() =>
					commands.command(({ state }) => {
						if (isAtBlockStart(state.selection.$anchor)) {
							return commands.liftListItem('docBlock');
						}

						return false;
					}),
				// try merge blocks
				() =>
					commands.command(({ tr, dispatch }) => {
						const { selection, doc } = tr;
						const { empty, $anchor } = selection;

						const isAtDocStart = Selection.atStart(doc).from === $anchor.pos;
						const blockInfo = getBlockInfoFromResolvedPos($anchor);

						if (!empty || isAtDocStart || !blockInfo || !isAtBlockStart($anchor, blockInfo.$block)) {
							return false;
						}

						// merge blocks
						const { $block, start, end, contentNode, nestedBlockCount } = blockInfo;

						// remove one level of nesting from any nested blocks
						if (nestedBlockCount > 0) {
							const nestedStart = doc.resolve(start + contentNode.nodeSize + 1);
							const nestedEnd = doc.resolve(end - 1);

							if (dispatch) {
								tr.lift(nestedStart.blockRange(nestedEnd)!, $block.depth - 1);
							}
						}

						const prevBlockInfo = getPreviousBlock(
							doc,
							start,
							(b) => b.contentType.spec.selectable !== false // might be undefined
						);

						if (!prevBlockInfo) {
							return false;
						}

						if (dispatch) {
							tr.deleteRange(start, start + contentNode.nodeSize);
							tr = tr.insert(prevBlockInfo.end - 1, contentNode.content);
							tr.setSelection(new TextSelection(tr.doc.resolve(prevBlockInfo.end - 1)));
						}

						return true;
					}),
				() => commands.joinBackward(),
				() => commands.selectNodeBackward(),
			]);

		const handleEnter = () =>
			this.editor.commands.first(({ commands }) => [
				() => commands.deleteSelection(),
				() => commands.convertBlockToDefaultState({ skip: this.options.ignoreKeysIn }),
				// if at the end of a block, create a new block below
				() =>
					commands.command(({ state }) => {
						const { $to } = state.selection;
						const { contentType } = getBlockInfoFromResolvedPos($to)!;

						if (this.options.ignoreKeysIn.indexOf(contentType.name) !== -1) {
							return false;
						}

						if ($to.parentOffset === $to.parent.content.size) {
							return commands.createBlockBelow();
						}

						return false;
					}),
				// if at the beginning create a new block above
				() =>
					commands.command(({ state }) => {
						const { $to } = state.selection;
						const { contentType } = getBlockInfoFromResolvedPos($to)!;

						if (this.options.ignoreKeysIn.indexOf(contentType.name) !== -1) {
							return false;
						}

						if ($to.parentOffset === 0) {
							return commands.createBlockAbove({ updateSelection: false });
						}

						return false;
					}),
				// try and split block
				() =>
					commands.command(({ state }) => {
						const { selection, doc } = state;
						const { $head, from, $to } = selection;
						const { contentType } = getBlockInfoFromResolvedPos($head)!;

						if (this.options.ignoreKeysIn.indexOf(contentType.name) !== -1) {
							return false;
						}

						// get the remaining content until the end of the block
						const distToEnd = $to.parent.content.size - $to.parentOffset;
						const content = doc.slice(from, from + distToEnd)?.toJSON().content;

						// insert a new block with the content wrapped in a paragraph
						commands.insertContentAt(
							{ from, to: from + distToEnd },
							{
								type: DocumentBlock.name,
								content: [
									{
										type: 'paragraph',
										content,
									},
								],
							}
						);
						commands.setTextSelection(from + 4);
						return true;
					}),
			]);

		return {
			Backspace: handleBackspace,
			Tab: ({ editor }) => {
				editor.commands.sinkListItem('docBlock');
				return true;
			},
			'Shift-Tab': ({ editor }) => {
				editor.commands.liftListItem('docBlock');
				return true;
			},
			Enter: handleEnter,
		};
	},

	addCommands() {
		return {
			createBlockBelow:
				(options?: CreateBlockOptions) =>
				({ state, editor, dispatch }) => {
					options = {
						updateSelection: true,
						content: null,
						...options,
					};
					const {
						selection: { $from },
					} = state;

					const blockInfo = getBlockInfoFromResolvedPos($from);
					if (!blockInfo) return false;

					const tr = state.tr.insert(
						blockInfo.end,
						editor.schema.nodes.docBlock!.createAndFill(null, options.content)!
					);

					if (options.updateSelection) {
						selectionToInsertionEnd(tr, tr.steps.length - 1, -1);
						dispatch?.(tr.scrollIntoView());
					}
					return true;
				},

			createBlockAbove:
				(options?: CreateBlockOptions) =>
				({ state, editor, dispatch }) => {
					options = {
						updateSelection: true,
						content: null,
						...options,
					};
					const {
						selection: { $from },
					} = state;
					const blockInfo = getBlockInfoFromResolvedPos($from);
					if (!blockInfo) return false;

					const tr = state.tr.insert(
						blockInfo.pos,
						editor.schema.nodes.docBlock!.createAndFill(null, options.content)!
					);

					if (options.updateSelection) {
						selectionToInsertionEnd(tr, tr.steps.length - 1, -1);
						dispatch?.(tr.scrollIntoView());
					}
					return true;
				},
			convertBlockToDefaultState:
				(options?) =>
				({ commands, tr }) => {
					options = {
						...options,
					};
					const { selection } = tr;
					const { empty, $anchor } = selection;
					const blockInfo = getBlockInfoFromResolvedPos($anchor);
					const isParagraph = blockInfo?.contentType?.name === 'paragraph';

					if (
						!empty ||
						!blockInfo ||
						!isAtBlockStart($anchor, blockInfo.$block) ||
						isParagraph ||
						options.skip?.includes(blockInfo?.contentType?.name)
					) {
						return false;
					}

					return commands.clearNodes();
				},
		};
	},
});

export default DocumentBlock;
