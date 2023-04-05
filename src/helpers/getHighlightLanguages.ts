import type { Language } from 'highlight.js';
import highlight from 'highlight.js/lib/core';
import { isEmpty } from 'lodash-es';

const languages: Record<string, Language> = {};
const aliases: Record<string, string> = {};

export function getHighlightLanguages() {
	if (isEmpty(languages)) {
		for (const canonicalName of highlight.listLanguages()) {
			const lang = highlight.getLanguage(canonicalName)!;

			languages[canonicalName] = lang;
			aliases[canonicalName] = canonicalName;
			for (const alias of lang.aliases || []) {
				aliases[alias] = canonicalName;
			}
		}
	}

	return {
		languages,
		aliases,
	};
}
