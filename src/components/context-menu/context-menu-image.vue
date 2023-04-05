<template>
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
import { BlockInfo } from '@/utils/block-info';
import { getPublicURL } from '@/utils/get-root-path';
import { Editor } from '@tiptap/core';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
	blockInfo: BlockInfo;
	editor: Editor;
}>();

const imageDialogOpen = ref(false);

function onImageUpload(image: any) {
	let url = getPublicURL() + `assets/` + image.id;
	const { editor } = props;
	const { view, state } = editor;

	// TODO
	// if (props.imageToken) {
	//   url += '?access_token=' + props.imageToken;
	// }

	console.log(props.blockInfo, url, image.id);
	view.dispatch(state.tr.setNodeMarkup(props.blockInfo.start, null, { src: url, id: image.id }));

	imageDialogOpen.value = false;
}

function setCaption() {
	const { editor } = props;

	editor
		.chain()
		.focus()
		.imageToFigure({ range: { from: props.blockInfo.start, to: props.blockInfo.end } })
		.run();
}
</script>
