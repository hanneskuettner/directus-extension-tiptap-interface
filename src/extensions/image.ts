import { Image as TipTapImage } from '@tiptap/extension-image';
import { VueNodeViewRenderer } from '@tiptap/vue-3';
import ImageNodeView from '../components/image-node-view.vue';

export const Image = TipTapImage.extend({
	draggable: false,
	selectable: false,

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
