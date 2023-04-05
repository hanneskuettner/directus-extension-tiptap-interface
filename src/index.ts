import TipTapEditor from '@/components/tiptap-editor.vue';
import { defineInterface } from '@directus/extensions-sdk';

export default defineInterface({
	id: 'tiptap-editor',
	name: 'Block Editor',
	icon: 'dns',
	description: 'A Notion-like editor experience',
	component: TipTapEditor,
	options: null,
	types: ['json'],
	group: 'standard',
});
