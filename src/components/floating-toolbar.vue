<template>
	<v-menu
		ref="root"
		v-model="open"
		class="floating-toolbar"
		:close-on-click="false"
		:close-on-content-click="false"
		:offset-y="offsetY"
		placement="top-start"
	>
		<div ref="wrapper" class="wrapper">
			<div class="toolbar-group">
				<v-menu placement="bottom-start">
					<template #activator="{ toggle }">
						<v-button x-small class="content-type-selector-button" @click="toggle">
							<span>{{ contentTypeTitle }}</span>
							<v-icon name="expand_more" small />
						</v-button>
					</template>
					<v-list>
						<span>Turn into</span>
						<v-list-item
							v-for="(command, index) in availableTurnIntoCommands"
							:key="index"
							:clickable="activeContentTypeMeta !== command"
							:active="activeContentTypeMeta === command"
							@click="executeCommand(command)"
						>
							<v-list-item-icon>
								<v-icon :name="command.icon" />
							</v-list-item-icon>
							<v-list-item-content>
								<v-text-overflow :text="command.title" />
							</v-list-item-content>
							<v-list-item-hint></v-list-item-hint>
						</v-list-item>
					</v-list>
				</v-menu>
			</div>
			<div class="toolbar-group">
				<v-button
					v-if="isExtensionInstalled('bold')"
					v-tooltip="t('wysiwyg_options.bold') + ' - ' + translateShortcut(['meta', 'b'])"
					:active="editor.isActive('bold')"
					x-small
					icon
					@click="toggleBold"
				>
					<v-icon name="format_bold" />
				</v-button>
				<v-button
					v-if="isExtensionInstalled('italic')"
					v-tooltip="t('wysiwyg_options.italic') + ' - ' + translateShortcut(['meta', 'i'])"
					:active="editor.isActive('italic')"
					x-small
					icon
					@click="toggleItalic"
				>
					<v-icon name="format_italic" />
				</v-button>
				<v-button
					v-if="isExtensionInstalled('underline')"
					v-tooltip="t('wysiwyg_options.underline') + ' - ' + translateShortcut(['meta', 'u'])"
					:active="editor.isActive('underline')"
					x-small
					icon
					@click="toggleUnderline"
				>
					<v-icon name="format_underline" />
				</v-button>
				<v-button
					v-if="isExtensionInstalled('strike')"
					v-tooltip="t('wysiwyg_options.strikethrough') + ' - ' + translateShortcut(['meta', 'shift', 'x'])"
					:active="editor.isActive('strike')"
					x-small
					icon
					@click="toggleStrike"
				>
					<v-icon name="format_strikethrough" />
				</v-button>
			</div>
		</div>
	</v-menu>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, toRefs, watch } from 'vue';
import { Editor } from '@tiptap/vue-3';
import { isNodeSelection, isTextSelection, posToDOMRect } from '@tiptap/core';
import { useI18n } from 'vue-i18n';
import { debounce } from 'lodash';
import { translateShortcut } from '../utils/translate-shortcut';
import { isExtensionInstalled } from '../helpers/isExtensionInstalled';
import { getBlockInfoFromResolvedPos } from '../utils/block-info';
import suggestion, { CommandItem } from '../suggestion';

const props = defineProps<{
	editor: Editor;
}>();
const { editor } = toRefs(props);

const root = ref(null);
const wrapper = ref(null);
const open = ref(false);
const preventShow = ref(false);
const { t } = useI18n();

onMounted(() => {
	// wait for editor to become available
	nextTick(() => {
		editor.value?.view.dom.addEventListener('dragstart', () => {
			preventShow.value = true;
			deactivate();
		});
		editor.value?.view.dom.addEventListener('dragend', () => (preventShow.value = false));
		editor.value?.view.dom.addEventListener('mouseup', () => (preventShow.value = false));
		editor.value?.view.dom.addEventListener('drop', () => (preventShow.value = false));

		editor.value.on('focus', () => nextTick(() => (preventShow.value = false)));
		editor.value.on('blur', ({ event }: { event: FocusEvent }) => {
			if (event?.relatedTarget && wrapper.value?.contains(event.relatedTarget as Node)) {
				return;
			}

			preventShow.value = true;
			deactivate();
		});
	});
});

const selectionRange = computed(() => {
	if (!editor.value) return undefined;

	// support for CellSelections
	const { ranges } = editor.value.state.selection;

	return {
		from: Math.min(...ranges.map((range) => range.$from.pos)),
		to: Math.max(...ranges.map((range) => range.$to.pos)),
	};
});

const shouldShow = computed(() => {
	if (!editor.value) return false;
	if (preventShow.value) return false;

	const { doc, selection } = editor.value.state;
	const { empty } = selection;
	const { from, to } = selectionRange.value;

	// Sometime check for `empty` is not enough.
	// Double-clicking an empty paragraph returns a node size of 2.
	// So we check also for an empty text size.
	const isEmptyTextBlock = !doc.textBetween(from, to).length && isTextSelection(selection);

	return !empty && !isEmptyTextBlock && editor.value.isEditable;
});

const positionRect = computed(() => {
	if (!editor.value) return;

	const { state, view } = editor.value;
	const { from, to } = selectionRange.value;

	if (isNodeSelection(state.selection)) {
		const node = view.nodeDOM(from) as HTMLElement;

		if (node) {
			return node.getBoundingClientRect();
		}
	}

	return posToDOMRect(view, from, to);
});
const offsetY = computed(() => (positionRect?.value?.height ?? 0) / 2);

function activate() {
	if (!shouldShow.value) return;

	const { x, y: clientY, height } = positionRect.value;
	root.value?.activate({ clientX: x - height / 2, clientY });
}

function deactivate() {
	if (shouldShow.value) return;

	root.value?.deactivate();
}

const delayedActivate = debounce(activate, 150);

watch([shouldShow, positionRect], ([newShow, _], [oldShown, __]) => {
	if (newShow === oldShown) return;

	if (shouldShow.value) {
		delayedActivate();
	} else {
		deactivate();
	}
});

const selectedBlockInfo = computed(() => getBlockInfoFromResolvedPos(editor.value.state.selection.$anchor));

const contentType = computed(() => {
	return selectedBlockInfo.value?.contentType?.name;
});
const activeContentTypeMeta = computed(() =>
	availableTurnIntoCommands.value.find(
		({ contentType: type, attrs }) =>
			type === contentType.value &&
			(!attrs ||
				Object.entries(attrs).every(([key, value]) => selectedBlockInfo.value?.contentNode?.attrs[key] === value))
	)
);
const contentTypeTitle = computed(() => {
	return activeContentTypeMeta.value?.title;
});

const availableTurnIntoCommands = computed(() =>
	suggestion.items({ query: '', editor: editor.value }).filter((command) => command.group === 'turnInto')
);

function executeCommand(command: CommandItem) {
	command.command({ editor: editor.value, range: { from: 0, to: 0 } });
}

const toggleBold = () => editor.value.chain().focus().toggleBold().run();
const toggleItalic = () => editor.value.chain().focus().toggleItalic().run();
const toggleUnderline = () => editor.value.chain().focus().toggleUnderline().run();
const toggleStrike = () => editor.value.chain().focus().toggleStrike().run();
</script>

<style lang="scss" scoped>
.floating-toolbar {
}

.wrapper {
	--v-button-background-color: transparent;
	--v-button-color: var(--foreground-normal);
	--v-button-background-color-hover: var(--border-normal);
	--v-button-color-hover: var(--foreground-normal);
	--v-button-background-color-active: transparent;
	--v-button-color-active: var(--primary);

	display: flex;
	margin: 0 -4px;

	.v-button + .v-button {
		margin-left: 2px;
	}

	:deep(.x-small) {
		border-radius: 0;
	}

	.toolbar-group {
		display: flex;
	}

	.toolbar-group + .toolbar-group {
		border-left: 1px solid var(--border-normal);
	}

	.content-type-selector-button {
		--v-icon-color: var(--foreground-normal);

		:deep(.button.x-small) {
			min-width: 0;
		}

		span {
			margin-right: 4px;
		}
	}
}
</style>
