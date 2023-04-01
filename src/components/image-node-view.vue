<template>
	<node-view-wrapper ref="root" class="image-node no-placeholder" as="div">
		<div class="wrapper" contenteditable="false">
			<div class="actions">
				<context-menu :get-pos="getPos" :editor="editor">
					<template #activator="{ toggle }">
						<v-button small icon @click="toggle">
							<v-icon class="options" name="more_horiz" />
						</v-button>
					</template>
				</context-menu>
			</div>
			<v-image
				v-if="node.attrs.src"
				:src="node.attrs.src"
				:title="node.attrs.title"
				:alt="node.attrs.alt"
				role="presentation"
			/>
			<v-upload v-else from-library from-url @input="onImageUpload" />
		</div>
		<div v-if="isFigure" class="caption" :data-placeholder="root?.$el.dataset.placeholder">
			<node-view-content />
		</div>
	</node-view-wrapper>
</template>

<script lang="ts" setup>
import { Editor, NodeViewContent, NodeViewWrapper } from '@tiptap/vue-3';
import { computed, ref } from 'vue';
import { Node, NodeView } from '@tiptap/pm/model';
import ContextMenu from './context-menu.vue';
import { getPublicURL } from '../utils/get-root-path';

const props = defineProps<{
	node: Node;
	getPos: NodeView['getPos'];
	editor: Editor;
}>();

const root = ref(null);
const isFigure = computed(() => props.node.type.name === 'figure');

function onImageUpload({ id }) {
	let url = getPublicURL() + `assets/` + id;
	const { editor } = props;
	const { view, state } = editor;

	// TODO
	// if (props.imageToken) {
	//   url += '?access_token=' + props.imageToken;
	// }

	view.dispatch(state.tr.setNodeMarkup(props.getPos(), null, { src: url, id }));
}
</script>

<style lang="scss" scoped>
.image-node {
	--v-button-background-color: var(--border-subdued);
	--placeholder: attr(data-placeholder);

	img {
		width: 100%;
		object-fit: cover;
	}
}

.wrapper {
	position: relative;
	width: 100%;
}

.actions {
	position: absolute;
	top: 4px;
	right: 4px;
	z-index: 1;
}

.empty .caption:before {
	content: attr(data-placeholder);
	opacity: 0.4;
	float: left;
	height: 0;
	pointer-events: none;
}
</style>
