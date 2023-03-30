import { Editor } from '@tiptap/core';

export function isExtensionInstalled(name: string) {
	return (editor: Editor) =>
		editor.extensionManager.extensions.find((extension) => extension.name === name) !== undefined;
}
