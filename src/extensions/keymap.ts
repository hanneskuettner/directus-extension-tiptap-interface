import { PRIORITY_KEYMAP } from '@/constants';
import DocumentBlock from '@/extensions/document-block';
import { isAtBlockStart } from '@/helpers/isAtBlockStart';
import { getBlockInfoFromResolvedPos } from '@/utils/block-info';
import { Extension } from '@tiptap/core';
import { Selection, TextSelection } from '@tiptap/pm/state';

interface KeyMapOptions {
	ignoreKeysIn: string[];
}

export const ExtendedKeymap = Extension.create<KeyMapOptions>({
	priority: PRIORITY_KEYMAP,

	addOptions() {
		return {
			ignoreKeysIn: [],
		};
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
					commands.command(({ tr }) => {
						const { selection, doc } = tr;
						const { empty, $anchor } = selection;

						const isAtDocStart = Selection.atStart(doc).from === $anchor.pos;
						const blockInfo = getBlockInfoFromResolvedPos($anchor);

						if (!empty || isAtDocStart || !blockInfo || !isAtBlockStart($anchor, blockInfo.$block)) {
							return false;
						}

						return commands.mergeBlockIntoPrevious();
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

		const handleTab = () =>
			this.editor.commands.first(({ commands }) => [
				() => {
					try {
						return commands.sinkListItem('docBlock');
					} catch (e: unknown) {
						// we can get a RangeError here since some elements don't allow nesting
						return false;
					}
				},
				// always capture tab to prevent jumping to next input
				() => true,
			]);

		const handleShiftTab = () =>
			this.editor.commands.first(({ commands }) => [
				() => commands.liftListItem('docBlock'),
				// always capture tab to prevent jumping to next input
				() => true,
			]);

		return {
			Backspace: handleBackspace,
			Tab: handleTab,
			'Shift-Tab': handleShiftTab,
			Enter: handleEnter,
			'Mod-a': ({ editor }) =>
				editor.commands.command(({ state, dispatch }) => {
					const { selection } = state;
					const { $from, $to } = selection;
					const spansMultipleNodes = !$from.sameParent($to);
					const isFullNodeSelected = $from.parentOffset === 0 && $to.parentOffset === $to.parent.content.size;

					if (spansMultipleNodes || isFullNodeSelected) {
						return false;
					}

					let depth = $from.depth;
					while ($from.node(depth).isInline) {
						if (!depth) return false;
						depth--;
					}
					if (!$from.node(depth).isTextblock) return false;
					if (dispatch)
						dispatch(state.tr.setSelection(TextSelection.create(state.doc, $from.start(depth), $from.end(depth))));
					return true;
				}),
		};
	},
});

export default ExtendedKeymap;
