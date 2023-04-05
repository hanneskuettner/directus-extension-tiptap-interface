import { getBlockInfoFromResolvedPos } from '@/utils/block-info';
import { ResolvedPos } from '@tiptap/pm/model';

export function isAtBlockStart($pos: ResolvedPos, $block?: ResolvedPos | null) {
	$block = $block ?? getBlockInfoFromResolvedPos($pos)?.$block;
	if (!$block) return false;

	return $pos.pos === $block.pos + $pos.depth - $block.depth;
}
