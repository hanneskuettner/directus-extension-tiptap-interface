import BlockGroup from '@/extensions/block-group';
import Blockquote from '@/extensions/blockquote';
import Bold from '@/extensions/bold';
import BulletList from '@/extensions/bullet-list';
import Code from '@/extensions/code';
import CodeBlock from '@/extensions/code-block';
import Document from '@/extensions/document';
import DocumentBlock from '@/extensions/document-block';
import DropCursor from '@/extensions/drop-cursor';
import Figure from '@/extensions/figure';
import Focus from '@/extensions/focus';
import HardBreak from '@/extensions/hard-break';
import Heading from '@/extensions/heading';
import History from '@/extensions/history';
import HorizontalRule from '@/extensions/horizontal-rule';
import Image from '@/extensions/image';
import Italic from '@/extensions/italic';
import ExtendedKeymap from '@/extensions/keymap';
import Link from '@/extensions/link';
import ListItem from '@/extensions/list-item';
import OrderedList from '@/extensions/ordered-list';
import Paragraph from '@/extensions/paragraph';
import Placeholder from '@/extensions/placeholder';
import SlashCommand from '@/extensions/slash-command';
import Strike from '@/extensions/strike';
import Text from '@/extensions/text';
import TrailingNode from '@/extensions/trailing-node';
import Typography from '@/extensions/typography';
import Underline from '@/extensions/underline';
import placeholder from '@/placeholder';
import suggestion from '@/suggestion';
import { EditorOptions, Extensions } from '@tiptap/core';
import { useEditor as useTiptapEditor } from '@tiptap/vue-3';
import { lowlight } from 'lowlight/lib/common';

export function useEditor(options: Partial<EditorOptions> = {}) {
	const buildInExtensions: Extensions = [
		BlockGroup,
		Blockquote,
		Bold,
		BulletList,
		Code,
		CodeBlock.configure({
			exitOnTripleEnter: false,
			defaultLanguage: 'javascript',
			lowlight,
		}),
		Document,
		DocumentBlock,
		DropCursor.configure({
			color: 'var(--primary)',
			width: 2,
		}),
		ExtendedKeymap.configure({
			ignoreKeysIn: ['codeBlock'],
		}),
		Figure,
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
