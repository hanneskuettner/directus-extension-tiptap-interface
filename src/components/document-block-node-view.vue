<template>
	<node-view-wrapper as="div" class="document-block">
		<div class="block-toolbar" contenteditable="false">
			<div class="block-toolbar-buttons">
				<v-icon
					v-tooltip.bottom="`Click to add a block below\n${translateShortcut(['alt'])}-click to add a block above`"
					name="add"
					small
					clickable
					@click.exact.prevent="addBelow"
					@click.alt.exact.prevent="addAbove"
				/>
				<context-menu
					:editor="editor"
					:get-first-child-pos="getFirstChildPos"
					:select-block="selectBlock"
					:is-image-block="isImageBlock"
					placement="left-start"
				>
					<template #activator="{ toggle }">
						<v-icon
							ref="dragHandle"
							v-tooltip.bottom="showTooltip ? 'Drag to move\nClick to open menu' : false"
							name="drag_indicator"
							small
							draggable="true"
							data-drag-handle
							@click.prevent="toggle"
							@dragstart="showTooltip = false"
							@dragend="onDragEnd"
						/>
					</template>
				</context-menu>
			</div>
		</div>
		<node-view-content class="block-content" />
	</node-view-wrapper>
</template>

<script lang="ts" setup>
import { Editor, NodeViewContent, NodeViewWrapper } from '@tiptap/vue-3';
import { Node } from '@tiptap/pm/model';
import ContextMenu from './context-menu.vue';
import { computed, ref, toRefs } from 'vue';
import { translateShortcut } from '../utils/translate-shortcut';

const props = defineProps<{
	node: Node;
	editor: Editor;
	getPos: () => number;
}>();
const { node, editor, getPos } = toRefs(props);

const dragHandle = ref<HTMLElement | null>(null);
const showTooltip = ref(true);

const isImageBlock = computed(() => node.value.child(0).type.name == 'image');

function onDragEnd() {
	showTooltip.value = true;
	// HACK: this seems to be the only way to prevent the tooltip from showing up at the previous drag location
	document.getElementById('tooltip')?.remove();
}

function getFirstChildPos() {
	return getPos.value() + 1;
}

function selectBlock() {
	editor.value.commands.setNodeSelection(getPos.value());
}

function addAbove() {
	editor.value.chain().focus().setNodeSelection(getPos.value()).createBlockAbove().run();
}

function addBelow() {
	editor.value.chain().focus().setNodeSelection(getPos.value()).createBlockBelow().run();
}
</script>

<style lang="scss" scoped>
.document-block {
	display: flex;
	padding: 3px 2px;
	margin-top: 2px;
	margin-bottom: 1px;

	.block-toolbar {
		display: flex;
		align-items: center;
		max-height: 40px;
		opacity: 0;

		.block-toolbar-buttons {
			display: flex;
			column-gap: 4px;
			margin-right: 0.5rem;

			.v-icon {
				height: 24px;
				padding: 3px 0;
				border-radius: 3px;
				transition-property: opacity, background-color;
				transition-duration: 200ms;
				transition-timing-function: ease-in-out;

				&:hover {
					background-color: var(--border-subdued);
				}

				&:has(> [data-icon='add']) {
					width: 24px;
					padding: 3px;
				}

				&[data-drag-handle] {
					cursor: grab;
				}

				:deep(i) {
					opacity: 0.6;
				}
			}
		}
	}

	&:hover > .block-toolbar {
		opacity: 1;
	}

	.block-content {
		flex: 1 1 auto;
	}
}
</style>
