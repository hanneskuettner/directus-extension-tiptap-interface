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
			<template v-if="isImageBlock">
				<v-divider />
				<v-list-item clickable @click="setCaption">
					<v-list-item-icon>
						<v-icon name="subtitles" />
					</v-list-item-icon>
					<v-list-item-content>Caption</v-list-item-content>
				</v-list-item>
				<v-list-item clickable @click="imageDialogOpen = true">
					<v-list-item-icon>
						<v-icon name="cached" />
					</v-list-item-icon>
					<v-list-item-content>Replace Image</v-list-item-content>
				</v-list-item>
			</template>
		</v-list>
	</v-menu>

	<v-dialog :model-value="imageDialogOpen" @esc="imageDialogOpen = false" @update:model-value="imageDialogOpen = false">
		<v-card>
			<v-card-title>{{ t('upload_from_device') }}</v-card-title>
			<v-card-text>
				<v-upload from-url from-library @input="onImageUpload" />
			</v-card-text>
			<v-card-actions>
				<v-button secondary @click="imageDialogOpen = false">{{ t('cancel') }}</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script lang="ts" setup>
import { IMAGE_TYPE_NAMES } from '@/constants';
import { getBlockInfoFromPos } from '@/utils/block-info';
import { controlledComputed } from '@/utils/controlled-computed';
import { getPublicURL } from '@/utils/get-root-path';
import { Node } from '@tiptap/pm/model';
import { Editor } from '@tiptap/vue-3';
import { computed, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';

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

const emit = defineEmits<{
	(e: 'deleted');
	(e: 'imageUploaded', image: any);
}>();

const open = ref(false);
const imageDialogOpen = ref(false);
const confirmDelete = ref(false);
const { t } = useI18n();

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
const isImageBlock = computed(() => IMAGE_TYPE_NAMES.includes(blockInfo.value?.contentType.name));

function onDeleteClicked() {
	if (!confirmDelete.value) {
		confirmDelete.value = true;
	} else {
		confirmDelete.value = false;
		props.editor.chain().focus().setNodeSelection(blockInfo.value.pos).deleteSelection().run();
		emit('deleted');
	}
}

function onImageUpload(image: any) {
	let url = getPublicURL() + `assets/` + image.id;
	const { editor } = props;
	const { view, state } = editor;

	// TODO
	// if (props.imageToken) {
	//   url += '?access_token=' + props.imageToken;
	// }

	console.log(blockInfo.value, url, image.id);
	view.dispatch(state.tr.setNodeMarkup(blockInfo.value.start, null, { src: url, id: image.id }));

	imageDialogOpen.value = false;
	emit('imageUploaded', image);
}

function setCaption() {
	const { editor } = props;

	editor
		.chain()
		.focus()
		.imageToFigure({ range: { from: blockInfo.value.start, to: blockInfo.value.end } })
		.run();
}
</script>

<style lang="scss" scoped>
.confirm-delete,
.confirm-delete .v-icon {
	background-color: var(--danger) !important;
	color: var(--white) !important;
}
</style>
