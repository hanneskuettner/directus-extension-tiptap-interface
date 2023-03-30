import { defineInterface } from '@directus/extensions-sdk';
import TipTapEditor from './components/tiptap-editor.vue';

export default defineInterface({
	id: 'tiptap-editor',
	name: 'Block Editor',
	icon: 'dns',
	description: 'A Notion-like editor experience',
	component: TipTapEditor,
	options: null,
	types: ['json'],
});
