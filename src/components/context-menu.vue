<template>
	<v-menu v-model="open" :close-on-content-click="!confirmDelete" :placement="placement">
		<template #activator="{ toggle }">
			<slot name="activator" :toggle="toggle" />
		</template>
		<v-list>
			<v-list-item clickable :class="{ 'confirm-delete': confirmDelete }" @click="onDeleteClicked">
				<v-list-item-icon><v-icon name="delete" /></v-list-item-icon>
				<v-list-item-content>
					{{ confirmDelete ? 'Click to Confirm' : 'Delete' }}
				</v-list-item-content>
			</v-list-item>
			<v-divider v-if="isImageBlock" />
			<v-list-item v-if="isImageBlock" clickable @click="imageDialogOpen = true">
				<v-list-item-icon><v-icon name="cached" /></v-list-item-icon>
				<v-list-item-content>Replace Image</v-list-item-content>
			</v-list-item>
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
import { useI18n } from 'vue-i18n';
import { ref, watch } from 'vue';
import { getPublicURL } from '../utils/get-root-path';
import { Node } from '@tiptap/pm/model';
import { Editor } from '@tiptap/vue-3';

const props = withDefaults(
	defineProps<{
		placement?: string;
		node: Node;
		selectBlock: () => void;
		getFirstChildPos: () => any;
		editor: Editor;
		isImageBlock?: boolean;
	}>(),
	{
		placement: 'bottom',
		isImageBlock: false,
	}
);

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

function onDeleteClicked() {
	if (!confirmDelete.value) {
		confirmDelete.value = true;
	} else {
		confirmDelete.value = false;
		props.selectBlock();
		props.editor.commands.deleteSelection();
		emit('deleted');
	}
}

function onImageUpload(image: any) {
	let url = getPublicURL() + `assets/` + image.id;

	// TODO
	// if (props.imageToken) {
	//   url += '?access_token=' + props.imageToken;
	// }

	const view = props.editor.view;
	view.dispatch(view.state.tr.setNodeMarkup(props.getFirstChildPos(), null, { src: url }));

	imageDialogOpen.value = false;
	emit('imageUploaded', image);
}
</script>

<style lang="scss" scoped>
.confirm-delete,
.confirm-delete .v-icon {
	background-color: var(--danger) !important;
	color: var(--white) !important;
}
</style>
