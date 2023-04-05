import ImageNodeView from '@/components/node-views/node-view-image.vue';
import { Image as TipTapImage } from '@tiptap/extension-image';
import { VueNodeViewRenderer } from '@tiptap/vue-3';

export const Image = TipTapImage.extend({
	draggable: false,
	selectable: false,

	group: 'fullBlock',

	addAttributes() {
		return {
			...this.parent?.(),
			id: {
				default: null,
				parseHTML: (element) => element.getAttribute('data-directus-id'),
				renderHTML: (attributes) => ({ 'data-directus-id': attributes.id }),
			},
		};
	},

	addNodeView() {
		return VueNodeViewRenderer(ImageNodeView);
	},
});

export default Image;
