import { Image as TipTapImage } from '@tiptap/extension-image';
import { VueNodeViewRenderer } from '@tiptap/vue-3';
import ImageNodeView from '../components/image-node-view.vue';

export const Image = TipTapImage.extend({
	draggable: false,
	selectable: false,

	addNodeView() {
		return VueNodeViewRenderer(ImageNodeView);
	},
});

export default Image;
