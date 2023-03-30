import { Node } from '@tiptap/pm/model';
import { getBlockInfoFromPos } from '../utils/block-info';

export function isLastBlockEmptyTopLevelParagraph(doc: Node) {
	const blockInfo = getBlockInfoFromPos(doc, doc.content.size - 2);
	if (!blockInfo) return false;

	return (
		blockInfo.nestedBlockCount === 0 &&
		blockInfo.contentType.name === 'paragraph' &&
		blockInfo.contentNode.textContent.length === 0
	);
}
