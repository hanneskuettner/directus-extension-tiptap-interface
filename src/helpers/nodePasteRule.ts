import { PasteRule, PasteRuleFinder, ExtendedRegExpMatchArray, callOrReturn } from '@tiptap/core';
import { NodeType } from '@tiptap/pm/model';
import { isFunction } from 'lodash-es';

// modified from https://github.com/ueberdosis/tiptap/blob/ae10f0d58ee1edb16a8ebe34e44d6a33e8361374/packages/core/src/pasteRules/nodePasteRule.ts

/**
 * Build a paste rule that adds a node when the
 * matched text is pasted into it.
 */
export function nodePasteRule(config: {
	find: PasteRuleFinder;
	type: NodeType;
	getAttributes?: Record<string, any> | ((match: ExtendedRegExpMatchArray) => Record<string, any>) | false | null;
	getText?: string | ((match: ExtendedRegExpMatchArray) => string | undefined);
}) {
	return new PasteRule({
		find: config.find,
		handler({ match, range, state }) {
			const attributes = callOrReturn(config.getAttributes, undefined, match);
			const text = isFunction(config.getText) ? config.getText(match) : config.getText;

			if (attributes === false || attributes === null) {
				return null;
			}

			if (match.input) {
				state.tr.replaceWith(
					range.from - 1,
					range.to + 1,
					config.type.create(attributes, text ? state.schema.text(text) : undefined)
				);
			}
		},
	});
}
