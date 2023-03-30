import { VueRenderer } from '@tiptap/vue-3';

import CommandsList from './components/command-list.vue';
import { nextTick } from 'vue';
import { Editor, Range } from '@tiptap/core';
import { Attrs } from '@tiptap/pm/model';
import { isExtensionInstalled } from './helpers/isExtensionInstalled';
import { RawCommands } from '@tiptap/core/dist/packages/core/src/types';

export interface CommandItem {
	title: string;
	group: keyof typeof commandGroups;
	icon?: string;
	command: ({ editor, range }: { editor: Editor; range: Range }) => void;
	enabled?: boolean | ((editor: Editor) => boolean);
	contentType?: string;
	attrs?: Attrs;
}

function unify(term: string) {
	return term.toLowerCase().replace(/\s+/g, '');
}

function isEnabled(item: CommandItem, editor: Editor) {
	return (
		item.enabled === undefined || item.enabled === true || (typeof item.enabled === 'function' && item.enabled(editor))
	);
}

function createFilter(query: string, editor: Editor) {
	query = unify(query);
	return (item: CommandItem) =>
		isEnabled(item, editor) &&
		(unify(item.title).includes(query) ||
			unify(item.group).includes(query) ||
			(commandGroups[item.group] && unify(commandGroups[item.group].title).includes(query)));
}

interface CreateBlockOptions {
	onEmptyParagraph?: ({ editor, range }: { editor: Editor; range: Range }) => void;
	deselectAfter?: boolean;
	updateSelection?: boolean;
}

function createBlockWith(name: string, attrs?: Attrs, options?: CreateBlockOptions) {
	return ({ editor, range }: { editor: Editor; range: Range }) => {
		options = {
			updateSelection: true,
			...options,
		};
		if (!editor.schema.nodes[name]) return;

		editor.chain().focus().deleteRange(range).run();

		const { $head } = editor.state.selection;
		const isEmptyParagraph = $head.parent.type.name === 'paragraph' && $head.parent.textContent === '';

		if (isEmptyParagraph) {
			if (options.onEmptyParagraph) {
				options.onEmptyParagraph({ editor, range });
			} else {
				editor.commands.insertContent(
					{
						type: name,
						attrs,
					},
					{ updateSelection: options.updateSelection }
				);
			}
		} else {
			editor.commands.createBlockBelow({
				content: editor.schema.nodes[name]?.createAndFill(attrs),
				updateSelection: options.updateSelection,
			});
		}

		if (options.deselectAfter) {
			editor.commands.setTextSelection(0);
		}
	};
}

function turnInto(name: string, attrs?: Attrs) {
	return ({ editor, range }: { editor: Editor; range: Range }) =>
		editor.chain().focus().deleteRange(range).setNode(name, attrs).run();
}

function runCommand(name: keyof RawCommands, ...args: any[]) {
	return ({ editor, range }: { editor: Editor; range: Range }) =>
		editor
			.chain()
			.focus()
			.deleteRange(range)
			// @ts-ignore
			[name](...args)
			.run();
}

const commandGroups = {
	basicBlock: {
		title: 'Basic blocks',
		sort: 0,
	},
	media: {
		title: 'Media',
		sort: 1,
	},
	turnInto: {
		title: 'Turn into',
		sort: 2,
	},
};

const commands: CommandItem[] = [
	{
		title: 'Text',
		icon: 'abc',
		group: 'turnInto',
		command: turnInto('paragraph'),
		contentType: 'paragraph',
	},
	{
		title: 'Heading 1',
		icon: 'title',
		group: 'basicBlock',
		command: createBlockWith('heading', { level: 1 }),
		enabled: isExtensionInstalled('heading'),
	},
	{
		title: 'Heading 1',
		icon: 'title',
		group: 'turnInto',
		command: turnInto('heading', { level: 1 }),
		enabled: isExtensionInstalled('heading'),
		contentType: 'heading',
		attrs: { level: 1 },
	},
	{
		title: 'Heading 2',
		icon: 'title',
		group: 'basicBlock',
		command: createBlockWith('heading', { level: 2 }),
		enabled: isExtensionInstalled('heading'),
	},
	{
		title: 'Heading 2',
		icon: 'title',
		group: 'turnInto',
		command: turnInto('heading', { level: 2 }),
		enabled: isExtensionInstalled('heading'),
		contentType: 'heading',
		attrs: { level: 2 },
	},
	{
		title: 'Heading 3',
		icon: 'title',
		group: 'basicBlock',
		command: createBlockWith('heading', { level: 3 }),
		enabled: isExtensionInstalled('heading'),
	},
	{
		title: 'Heading 3',
		icon: 'title',
		group: 'turnInto',
		command: turnInto('heading', { level: 3 }),
		enabled: isExtensionInstalled('heading'),
		contentType: 'heading',
		attrs: { level: 3 },
	},
	{
		title: 'Bulleted list',
		icon: 'format_list_bulleted',
		group: 'basicBlock',
		command: createBlockWith('bulletList', {}, { onEmptyParagraph: runCommand('toggleBulletList') }),
		enabled: isExtensionInstalled('bulletList'),
		contentType: 'bulletList',
	},
	{
		title: 'Bulleted list',
		icon: 'format_list_bulleted',
		group: 'turnInto',
		command: runCommand('toggleBulletList'),
		enabled: isExtensionInstalled('bulletList'),
		contentType: 'bulletList',
	},
	{
		title: 'Numbered list',
		icon: 'format_list_numbered',
		group: 'basicBlock',
		command: createBlockWith('orderedList', {}, { onEmptyParagraph: runCommand('toggleOrderedList') }),
		enabled: isExtensionInstalled('orderedList'),
		contentType: 'orderedList',
	},
	{
		title: 'Numbered list',
		icon: 'format_list_numbered',
		group: 'turnInto',
		command: runCommand('toggleOrderedList'),
		enabled: isExtensionInstalled('orderedList'),
		contentType: 'orderedList',
	},
	{
		title: 'Quote',
		icon: 'format_quote',
		group: 'basicBlock',
		command: createBlockWith('blockquote', {}, { onEmptyParagraph: runCommand('setBlockquote') }),
		enabled: isExtensionInstalled('blockquote'),
		contentType: 'blockquote',
	},
	{
		title: 'Quote',
		icon: 'format_quote',
		group: 'turnInto',
		command: runCommand('setBlockquote'),
		enabled: isExtensionInstalled('blockquote'),
		contentType: 'blockquote',
	},
	{
		title: 'Divider',
		icon: 'minimize',
		group: 'basicBlock',
		command: createBlockWith('horizontalRule', {}, { updateSelection: false }),
		enabled: isExtensionInstalled('image'),
	},
	{
		title: 'Image',
		icon: 'image',
		group: 'media',
		command: createBlockWith('image', {}, { deselectAfter: true }),
		enabled: isExtensionInstalled('image'),
	},
	{
		title: 'Code block',
		icon: 'code',
		group: 'media',
		command: createBlockWith('codeBlock'),
		enabled: isExtensionInstalled('codeBlock'),
	},
];

export default {
	items: ({ query, editor }: { query: string; editor: Editor }) => {
		return commands.filter(createFilter(query, editor));
	},

	render: () => {
		let component: VueRenderer;

		const calcPosition = ({ x, y, height }: DOMRect) => ({
			x,
			y: y + height / 2,
			offsetX: 0,
			offsetY: height / 2 + 4,
		});

		return {
			onStart: (props: any) => {
				const position = calcPosition(props.clientRect());
				component = new VueRenderer(CommandsList, {
					props: {
						...props,
						offsetY: position.offsetY,
						commandGroups,
					},
					editor: props.editor,
				});

				if (!props.clientRect) {
					return;
				}

				nextTick(() => component.ref.activate(position));
			},

			onUpdate(props: any) {
				const position = calcPosition(props.clientRect());
				component.updateProps({
					...props,
					offsetY: position.offsetY,
				});

				if (!props.clientRect) {
					return;
				}

				component.ref?.activate(position);
			},

			onKeyDown(props: any) {
				if (props.event.key === 'Escape') {
					component.ref?.deactivate();
					return true;
				}

				return component.ref?.onKeyDown(props.event);
			},

			onExit() {
				component.destroy();
			},
		};
	},
};
