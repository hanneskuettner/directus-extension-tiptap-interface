import { InputRule } from '@tiptap/core';
import { HorizontalRule as TipTapHorizontalRule } from '@tiptap/extension-horizontal-rule';

export const HorizontalRule = TipTapHorizontalRule.extend({
	selectable: false,
	group: 'blockWithoutChildren',

	addInputRules() {
		return [
			new InputRule({
				find: /^(?:---|—-|___\s|\*\*\*\s)$/,
				handler: ({ state, range, match, chain }) => {
					const { tr } = state;
					let start = range.from;
					let end = range.to;

					if (match[1]) {
						const offset = match[0].lastIndexOf(match[1]);
						let matchStart = start + offset;

						if (matchStart > end) {
							matchStart = end;
						} else {
							end = matchStart + match[1].length;
						}

						// insert last typed character
						const lastChar = match[0][match[0].length - 1];

						tr.insertText(lastChar!, start + match[0].length - 1);

						start = matchStart;
					}

					if (match[0] || match[1]) {
						chain()
							.deleteRange({ from: start, to: end })
							.createBlockAbove({
								content: this.type.create(),
								updateSelection: false,
							})
							.run();
					}
				},
			}),
		];
	},
});

export default HorizontalRule;
