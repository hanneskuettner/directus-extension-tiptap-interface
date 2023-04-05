<template>
	<node-view-wrapper as="pre" class="code-block">
		<v-menu contenteditable="false" placement="bottom-start">
			<template #activator="{ toggle }">
				<v-button x-small @click.prevent="toggle">
					<span>{{ highlightLanguages[selectedLanguage].name || selectedLanguage }}</span>
					<v-icon name="keyboard_arrow_down" small />
				</v-button>
			</template>

			<v-list>
				<v-list-item
					v-for="lang in languages"
					:key="lang.key"
					:clickable="selectedLanguage !== lang.key"
					:active="selectedLanguage === lang.key"
					@click="selectLanguage(lang.key)"
				>
					<v-list-item-content>
						<v-text-overflow :text="lang.name" />
					</v-list-item-content>
				</v-list-item>
			</v-list>
		</v-menu>
		<node-view-content as="code" :class="node.attrs?.language ? `language-${node.attrs?.language}` : ''" />
	</node-view-wrapper>
</template>

<script lang="ts" setup>
import { getHighlightLanguages } from '@/helpers/getHighlightLanguages';
import { Editor } from '@tiptap/core';
import { Node } from '@tiptap/pm/model';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/vue-3';
import { computed } from 'vue';

const props = defineProps<{
	node: Node;
	editor: Editor;
}>();

const { languages: highlightLanguages } = getHighlightLanguages();
const languages = computed(() => Object.entries(highlightLanguages).map(([key, lang]) => ({ key, name: lang.name })));
const selectedLanguage = computed(() => props.node.attrs.language);

function selectLanguage(language) {
	props.editor.commands.updateAttributes('codeBlock', { language });
}
</script>

<style lang="scss" scoped>
.code-block {
	display: flex;
	flex-direction: column;
	padding: 0 36px 36px !important;

	.v-menu {
		display: block;
		margin: 4px 0 4px -32px;
		user-select: none;
		transition: opacity 200ms ease-in-out;
		opacity: 0;

		.v-icon {
			margin-left: 4px;
		}
	}

	&:hover .v-menu {
		opacity: 1;
	}
}
</style>
