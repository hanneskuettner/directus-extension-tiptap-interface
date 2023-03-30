// findParentNodeClosestToPos modified from (also needs to test at depth 0)
// https://github.com/ueberdosis/tiptap/blob/8eb8252d011c33899de04cf4aae1a3ca3ea3b21a/packages/core/src/helpers/findParentNodeClosestToPos.ts#L5

import { Node, ResolvedPos } from '@tiptap/pm/model';
import { Predicate } from '@tiptap/core';

export function findParentNodeClosestToPos(
	$pos: ResolvedPos,
	predicate: Predicate
):
	| {
			pos: number;
			start: number;
			depth: number;
			node: Node;
	  }
	| undefined {
	for (let i = $pos.depth; i >= 0; i -= 1) {
		const node = $pos.node(i);

		if (predicate(node)) {
			return {
				pos: i > 0 ? $pos.before(i) : 0,
				start: $pos.start(i),
				depth: i,
				node,
			};
		}
	}
	return undefined;
}
