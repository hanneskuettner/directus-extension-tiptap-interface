import { Blockquote as TipTapBlockquote } from '@tiptap/extension-blockquote';

export const Blockquote = TipTapBlockquote.extend({
	group: 'blockWithoutChildren',
});

export default Blockquote;
