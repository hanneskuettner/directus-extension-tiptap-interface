import { Node } from '@tiptap/pm/model';

export interface BlockNode extends Partial<Pick<Node, 'attrs' | 'marks' | 'text'>> {
	type: string;
	content?: BlockNode[];
	children?: BlockNode[];
}
