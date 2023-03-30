import { NodeType, Node, ResolvedPos } from '@tiptap/pm/model';
import { findParentNodeClosestToPos } from '../helpers/findParentNodeClosestToPos';

export interface BlockInfo {
	$block: ResolvedPos;
	block: Node;
	contentNode: Node;
	contentType: NodeType;
	nestedBlockNode?: Node;
	nestedBlockCount: number;
	depth: number;
	pos: number;
	start: number;
	end: number;
}

export function findBlock($pos: ResolvedPos) {
	if ($pos.doc.nodeAt($pos.pos)?.type?.name === 'docBlock') {
		return {
			pos: $pos.pos,
			start: $pos.start($pos.depth + 1),
			depth: $pos.depth + 1,
			node: $pos.doc.nodeAt($pos.pos)!,
		};
	}
	return findParentNodeClosestToPos($pos, (node) => node.type.name === 'docBlock');
}

export function getBlockInfoFromResolvedPos($pos: ResolvedPos): BlockInfo | undefined {
	const nodeInfo = findBlock($pos);

	if (!nodeInfo) {
		return undefined;
	}

	const $block = $pos.doc.resolve(nodeInfo.start);
	const block = nodeInfo.node;
	const contentNode = block.firstChild!;
	const contentType = contentNode.type;
	const nestedBlockNode = block.childCount === 2 ? block.lastChild! : undefined;
	const nestedBlockCount = nestedBlockNode?.childCount ?? 0;
	const end = $block.end($block.depth);

	return {
		$block,
		block,
		contentNode,
		contentType,
		nestedBlockNode,
		nestedBlockCount,
		depth: nodeInfo.depth,
		pos: nodeInfo.pos,
		start: nodeInfo.start,
		end,
	};
}

export function getBlockInfoFromPos(doc: Node, pos: number) {
	return getBlockInfoFromResolvedPos(doc.resolve(pos));
}
