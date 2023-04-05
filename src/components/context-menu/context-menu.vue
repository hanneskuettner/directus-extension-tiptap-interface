<template>
	<v-menu v-model="open" :close-on-content-click="!confirmDelete" :placement="placement">
		<template #activator="{ toggle }">
			<slot name="activator" :toggle="toggle" />
		</template>
		<v-list>
			<v-list-item clickable :class="{ 'confirm-delete': confirmDelete }" @click="onDeleteClicked">
				<v-list-item-icon>
					<v-icon name="delete" />
				</v-list-item-icon>
				<v-list-item-content>
					{{ confirmDelete ? 'Click to Confirm' : 'Delete' }}
				</v-list-item-content>
			</v-list-item>
			<template v-if="blockTypeMenu">
				<v-divider />
				<component :is="blockTypeMenu" :block-info="blockInfo" :editor="editor" />
			</template>
		</v-list>
	</v-menu>
</template>

<script lang="ts" setup>
import { contextMenuTypes } from '@/context-menu-types';
import { getBlockInfoFromPos } from '@/utils/block-info';
import { controlledComputed } from '@/utils/controlled-computed';
import { Node } from '@tiptap/pm/model';
import { Editor } from '@tiptap/vue-3';
import { computed, ref, toRefs, watch } from 'vue';

const props = withDefaults(
	defineProps<{
		placement?: string;
		node: Node;
		getPos: () => number;
		editor: Editor;
	}>(),
	{
		placement: 'bottom',
		isImageBlock: false,
	}
);
const { getPos } = toRefs(props);

const open = ref(false);
const confirmDelete = ref(false);

watch(open, () => {
	if (!open.value) {
		confirmDelete.value = false;
	}
});

const blockInfo = controlledComputed(
	() => getPos.value(),
	() =>
		getPos.value() < props.editor.state.doc.nodeSize
			? getBlockInfoFromPos(props.editor.state.doc, getPos.value())
			: undefined
);

const blockTypeMenu = computed(() => contextMenuTypes[blockInfo.value?.contentType.name]);

function onDeleteClicked() {
	if (!confirmDelete.value) {
		confirmDelete.value = true;
	} else {
		confirmDelete.value = false;
		props.editor.chain().focus().setNodeSelection(blockInfo.value.pos).deleteSelection().run();
	}
}
</script>

<style lang="scss" scoped>
.confirm-delete,
.confirm-delete .v-icon {
	background-color: var(--danger) !important;
	color: var(--white) !important;
}
</style>
