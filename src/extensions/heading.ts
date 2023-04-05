import { nodePasteRule } from '@/helpers/nodePasteRule';
import { Heading as TipTapHeading } from '@tiptap/extension-heading';

export const Heading = TipTapHeading.extend({
	group: 'blockWithoutChildren',

	addPasteRules() {
		return this.options.levels.map((level) => {
			return nodePasteRule({
				find: new RegExp(`^(#{1,${level}})\\s([^#]+)$`, 'gm'),
				type: this.type,
				getText: (match) => {
					console.log(match, match[2], level);
					return match[2];
				},
				getAttributes: {
					level,
				},
			});
		});
	},
});

export default Heading;
