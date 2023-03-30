<template>
	<div class="interface-input-rich-block">
		<editor-content class="content" :editor="editor" />
		<floating-toolbar :editor="editor" />
	</div>
</template>

<script lang="ts" setup>
import { Editor, EditorContent, JSONContent } from '@tiptap/vue-3';
import { useEditor } from '../composables/useEditor';
import { ref, toRefs, watch } from 'vue';
import { isEqual } from 'lodash';
import FloatingToolbar from './floating-toolbar.vue';
import { blocksToDoc, docToBlocks } from '../utils/node-conversions';
import { BlockNode } from '../types/block';

const props = withDefaults(
	defineProps<{
		value: JSONContent;
		disabled?: boolean;
	}>(),
	{
		disabled: false,
	}
);

const emit = defineEmits<{
	(e: 'input', value: JSONContent);
}>();

const { value: blocks, disabled } = toRefs(props);

const editor = createEditor();
const intervalValue = ref([]);

watch([blocks, editor], () => {
	if (!editor.value) return;

	if (!isEqual(blocks.value, intervalValue.value)) {
		const {
			view,
			state: { tr, doc: oldDoc },
		} = editor.value;

		const doc = blocksToDoc(blocks.value as BlockNode[], editor.value.schema);
		view.dispatch(
			tr.replaceWith(0, oldDoc.content.size, doc).setMeta('preventUpdate', true).setMeta('addToHistory', false)
		);
	}
});

watch(disabled, (newDisabled, oldDisabled) => {
	if (newDisabled !== oldDisabled) {
		editor.value?.setEditable(!newDisabled);
	}
});

function createEditor() {
	return useEditor({
		editable: !disabled.value,
		onUpdate({ editor }: { editor: Editor }) {
			intervalValue.value = docToBlocks(editor.state.doc);
			emit('input', intervalValue.value);
		},
	});
}
</script>

<style lang="scss" scoped>
.interface-input-rich-block {
	--v-button-background-color: transparent;
	--v-button-color: var(--foreground-normal);
	--v-button-background-color-hover: var(--border-normal);
	--v-button-color-hover: var(--foreground-normal);
	min-height: 300px;
	overflow: hidden;
	font-family: var(--family-sans-serif);
	margin: 0 auto;

	min-width: 0;
	max-width: 100%;
	width: 900px;
}

.interface-input-rich-block.disabled {
	background-color: var(--background-subdued);
}

.content :deep(p) {
	font-size: 16px;
}

.content :deep(ul),
.content :deep(ol) {
	padding-inline-start: 20px;
}

.content :deep([data-placeholder].empty:before) {
	content: attr(data-placeholder);
	opacity: 0.4;
	float: left;
	height: 0;
	pointer-events: none;
}

.content :deep(.document-block) {
	&:has(h1) {
		margin-top: 2em;
	}

	&:has(h2) {
		margin-top: 1.4em;
	}

	&:has(h3) {
		margin-top: 1em;
	}
}

.content :deep(h1) {
	color: var(--foreground-normal-alt);
	font-weight: 600;
	font-size: 1.875em;
	line-height: 1.3;
}

.content :deep(h2) {
	color: var(--foreground-normal-alt);
	font-weight: 600;
	font-size: 1.4em;
	line-height: 1.3;
}

.content :deep(h3) {
	color: var(--foreground-normal-alt);
	font-size: 1.25em;
	font-weight: 600;
	line-height: 1.3;
}

.content :deep(a) {
	color: var(--primary-125);
	text-decoration: none;
}

.content :deep(ul),
.content :deep(ol) {
	font-weight: 500;
	font-size: 15px;
	line-height: 24px;
}

.content :deep(ul ul),
.content :deep(ol ol),
.content :deep(ul ol),
.content :deep(ol ul) {
	margin: 0;
}

.content :deep(b),
.content :deep(strong) {
	font-weight: 700;
}

.content :deep(code) {
	font-weight: 500;
	font-size: 15px;
	font-family: var(--family-monospace), monospace;
	line-height: 24px;
	overflow-wrap: break-word;
	background-color: var(--background-normal);
	border-radius: var(--border-radius);
}

.content :deep(pre) {
	padding: 1em;
	overflow: auto;
	font-weight: 500;
	font-size: 15px;
	font-family: var(--family-monospace), monospace;
	line-height: 24px;
	background-color: var(--background-normal);
	border-radius: var(--border-radius);
}

.content :deep(blockquote) {
	margin-left: 0;
	padding-left: 1em;
	font-weight: 500;
	font-size: 15px;
	line-height: 24px;
	border-left: 2px solid var(--border-normal);
}

.content :deep(blockquote blockquote) {
	margin-left: 10px;
}

.content :deep(video),
.content :deep(iframe),
.content :deep(img) {
	max-width: 100%;
	height: auto;
	border-radius: var(--border-radius);
}

.content :deep(hr) {
	height: 1px;
	margin: 11px 0;
	background-color: var(--border-normal);
	border: none;
}

.content :deep(table) {
	font-weight: 500;
	font-size: 15px;
	line-height: 24px;
	border-collapse: collapse;
}

.content :deep(table th),
.content :deep(table td) {
	padding: 0.4rem;
	border: 1px solid var(--border-normal);
}

.content :deep(figure) {
	display: table;
	margin: 1rem auto;
}

.content :deep(figure figcaption) {
	display: block;
	margin-top: 0.25rem;
	color: #999;
	text-align: center;
}
</style>
