import DocumentBlockNodeView from '@/components/node-views/node-view-document-block.vue';
import { PRIORITY_DOCUMENT_BLOCK } from '@/constants';
import { isAtBlockStart } from '@/helpers/isAtBlockStart';
import { BlockInfo, getBlockInfoFromPos, getBlockInfoFromResolvedPos } from '@/utils/block-info';
import { mergeAttributes, Node, selectionToInsertionEnd } from '@tiptap/core';
import { Fragment, Node as ProseMirrorNode } from '@tiptap/pm/model';
import { TextSelection } from '@tiptap/pm/state';
import { VueNodeViewRenderer } from '@tiptap/vue-3';

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

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		block: {
			createBlockAbove: (options?: CreateBlockOptions) => ReturnType;
			createBlockBelow: (options?: CreateBlockOptions) => ReturnType;
			convertBlockToDefaultState: (options?: { skip?: string[] }) => ReturnType;
			mergeBlockIntoPrevious: () => ReturnType;
		};
	}
}

export const DocumentBlock = Node.create({
	name: 'docBlock',
	group: 'docBlock',
	content: '(block blockGroup?) | blockWithoutChildren',
	draggable: true,
	selectable: false,
	defining: true,
	priority: PRIORITY_DOCUMENT_BLOCK,

	foobar: true,

	addOptions() {
		return {
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
			mergeBlockIntoPrevious:
				() =>
				({ tr, state, dispatch }) => {
					const { doc } = tr;
					const { $anchor } = state.selection;
					const blockInfo = getBlockInfoFromResolvedPos($anchor);

					if (!blockInfo) return false;

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
				},
		};
	},
});

export default DocumentBlock;
