import { Node } from '@tiptap/pm/model';

const placeholder: Record<string, string | ((node: Node) => string)> = {
	heading: (node) => `Heading ${node.attrs.level}`,
	codeBlock: '',
};

const commandPlaceholder = 'Press `/` for commands...';

export default function ({ node }: { node: Node }) {
	const p = placeholder[node.type.name];
	return p !== undefined ? (typeof p === 'function' ? p(node) : p) : commandPlaceholder;
}
