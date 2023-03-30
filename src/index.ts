import { defineInterface } from '@directus/extensions-sdk';
import TipTapEditor from './components/tiptap-editor.vue';

export default defineInterface({
	id: 'tiptap-editor',
	name: 'Block Editor',
	icon: 'box',
	description: '',
	component: TipTapEditor,
	options: null,
	types: ['json'],
});
