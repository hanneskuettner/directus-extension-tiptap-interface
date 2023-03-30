<template>
	<node-view-wrapper data-drag-handle class="image-node">
		<div class="wrapper">
			<div class="actions">
				<context-menu :select-block="selectBlock" :get-first-child-pos="getPos" :editor="editor" is-image-block>
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
			<v-upload v-else from-library from-url @input="setSrc" />
		</div>
	</node-view-wrapper>
</template>

<script lang="ts" setup>
import { Editor, NodeViewWrapper } from '@tiptap/vue-3';
import { Node, NodeView } from '@tiptap/pm/model';
import ContextMenu from './context-menu.vue';
import { getPublicURL } from '../utils/get-root-path';

const props = defineProps<{
	node: Node;
	getPos: NodeView['getPos'];
	deleteNode: NodeView['deleteNode'];
	editor: Editor;
}>();

function selectBlock() {
	props.editor.commands.setNodeSelection(props.getPos());
	props.editor.commands.selectParentNode();
}

function setSrc(image) {
	let url = getPublicURL() + `assets/` + image.id;
	const view = props.editor.view;
	view.dispatch(view.state.tr.setNodeMarkup(props.getPos(), null, { src: url }));
}
</script>

<style lang="scss" scoped>
.image-node {
	--v-button-background-color: var(--border-subdued);

	display: flex;

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
</style>
