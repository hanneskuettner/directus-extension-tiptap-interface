import { Node, Schema } from '@tiptap/pm/model';
import { getBlockInfoFromPos } from './block-info';
import { BlockNode } from '../types/block';

function getTopLevelBlockNodes(doc: Node) {
	const nodes: Node[] = [];

	doc.firstChild!.forEach((node) => {
		nodes.push(node);
	});

	return nodes;
}

export function blockToNode(block: BlockNode, schema: Schema) {
	const content = [schema.nodeFromJSON(block)];

	if (block.children) {
		content.push(
			schema.nodes.blockGroup!.create(
				null,
				block.children.map((child) => blockToNode(child, schema))
			)
		);
	}

	return schema.nodes.docBlock!.create(null, content);
}

/**
 * Convert a node to a block node
 */
export function nodeToBlock(node: Node): BlockNode | undefined {
	if (node.type.name !== 'docBlock') {
		return undefined;
	}

	const { contentNode, contentType, nestedBlockNode } = getBlockInfoFromPos(node, 0)!;
	const { attrs, text, marks, content } = contentNode;

	const children: BlockNode[] = [];
	nestedBlockNode?.forEach((child) => children.push(nodeToBlock(child)!));

	return {
		type: contentType.name,
		...(attrs && { attrs }),
		...(text && { text }),
		...(marks && { marks }),
		...(content.childCount > 0 && { content: content.toJSON() }),
		...(nestedBlockNode && { children }),
	};
}

export function docToBlocks(doc: Node): BlockNode[] {
	// remove always empty last paragraph first, then transform
	return getTopLevelBlockNodes(doc).slice(0, -1).map(nodeToBlock) as BlockNode[];
}

export function blocksToDoc(blocks: BlockNode[], schema: Schema): Node {
	// insert empty paragraph at end (would be inserted by TrailingNode anyways)
	return schema.nodes.doc!.create(
		null,
		schema.nodes.blockGroup!.create(
			null,
			[...blocks, { type: 'paragraph' }].map((block) => blockToNode(block, schema))
		)
	);
}
