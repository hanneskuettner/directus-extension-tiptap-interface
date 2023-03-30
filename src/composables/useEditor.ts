import { EditorOptions, Extensions } from '@tiptap/core';
import { useEditor as useTiptapEditor } from '@tiptap/vue-3';
import BlockGroup from '../extensions/block-group';
import Bold from '../extensions/bold';
import BulletList from '../extensions/bullet-list';
import Code from '../extensions/code';
import CodeBlock from '../extensions/code-block';
import Document from '../extensions/document';
import DocumentBlock from '../extensions/document-block';
import DropCursor from '../extensions/drop-cursor';
import HardBreak from '../extensions/hard-break';
import History from '../extensions/history';
import Heading from '../extensions/heading';
import HorizontalRule from '../extensions/horizontal-rule';
import Focus from '../extensions/focus';
import Image from '../extensions/image';
import Italic from '../extensions/italic';
import Link from '../extensions/link';
import ListItem from '../extensions/list-item';
import OrderedList from '../extensions/ordered-list';
import Paragraph from '../extensions/paragraph';
import Placeholder from '../extensions/placeholder';
import SlashCommand from '../extensions/slash-command';
import Strike from '../extensions/strike';
import Text from '../extensions/text';
import TrailingNode from '../extensions/trailing-node';
import Typography from '../extensions/typography';
import Underline from '../extensions/underline';
import suggestion from '../suggestion';
import placeholder from '../placeholder';

export function useEditor(options: Partial<EditorOptions> = {}) {
	const buildInExtensions: Extensions = [
		BlockGroup,
		Bold,
		BulletList,
		Code,
		CodeBlock.configure({
			exitOnTripleEnter: false,
		}),
		Document,
		DocumentBlock,
		DropCursor.configure({
			color: 'var(--primary)',
			width: 2,
		}),
		Focus.configure({
			className: 'has-focus',
			mode: 'shallowest',
		}),
		HardBreak,
		Heading.configure({
			levels: [1, 2, 3],
		}),
		History,
		HorizontalRule,
		Image,
		Italic,
		Link,
		ListItem,
		OrderedList,
		Paragraph,
		Placeholder.configure({
			emptyNodeClass: 'empty',
			includeChildren: true,
			placeholder,
			showOnlyCurrent: ({ node }) => node.type.name === 'paragraph',
		}),
		SlashCommand.configure({
			suggestion,
		}),
		Strike,
		Text,
		TrailingNode,
		Typography,
		Underline,
	];

	return useTiptapEditor({
		...options,
		extensions: [...buildInExtensions, ...(options.extensions ?? [])],
	});
}
