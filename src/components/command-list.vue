<template>
	<div>
		<v-menu ref="root" class="command-list" :offset-x="offsetX" :offset-y="offsetY" placement="bottom-start">
			<template v-if="availableGroups.length">
				<div v-for="group in availableGroups" :key="group.key" class="group">
					<span class="group-title">{{ group.title }}</span>
					<v-list-item
						v-for="(item, index) in groupedItems[group.key]"
						:ref="(el) => itemRefs.push(el)"
						:key="index"
						class="item"
						:active="activeIndex === group.indexOffset + index"
						clickable
						@click="executeItem(item)"
					>
						<v-icon v-if="item.icon" :name="item.icon" small />
						<span>
							{{ item.title }}
						</span>
					</v-list-item>
				</div>
			</template>
			<v-list-item v-else>No result</v-list-item>
		</v-menu>
	</div>
</template>

<script lang="ts" setup>
import { groupBy, sortBy } from 'lodash-es';
import { computed, onBeforeUpdate, ref, toRefs } from 'vue';

interface Item {
	title: string;
	icon: string;
}

const props = withDefaults(
	defineProps<{
		items: {
			title: string;
			group: string;
			icon: string;
		}[];
		command: (item: Item) => void;
		commandGroups: Record<string, { title: string; sort: number }>;
		offsetX?: number;
		offsetY?: number;
	}>(),
	{
		offsetX: 0,
		offsetY: 0,
	}
);
const { items, command, commandGroups } = toRefs(props);

const root = ref(null);
const itemRefs = ref([]);
const activeIndex = ref(0);

onBeforeUpdate(() => {
	itemRefs.value = [];
});

const sortedGroups = computed(() => sortBy(Object.entries(commandGroups.value), '1.sort'));
const groupedItems = computed(() => groupBy(items.value, 'group'));
const availableGroups = computed(() => {
	const filteredGroups = sortedGroups.value.filter(([key, _]) => groupedItems.value[key]);
	let offset = 0;
	const availableGroups = [];
	for (const [key, group] of filteredGroups) {
		availableGroups.push({
			key,
			...group,
			indexOffset: offset,
		});
		offset += groupedItems.value[key].length;
	}
	return availableGroups;
});
const originalItemIndices = computed(() => {
	const indices = [];
	for (const group of availableGroups.value) {
		for (const item of groupedItems.value[group.key]) {
			indices.push(items.value.findIndex((i) => i === item));
		}
	}
	return indices;
});

function executeItem(item: any) {
	if (!item) return;
	command.value(item);
}

const keyHandlers = {
	ArrowUp: () => (activeIndex.value = (items.value.length + activeIndex.value - 1) % items.value.length),
	ArrowDown: () => (activeIndex.value = (activeIndex.value + 1) % items.value.length),
	Enter: () => executeItem(items.value[originalItemIndices.value[activeIndex.value]]),
};

function onKeyDown(e: KeyboardEvent) {
	if (keyHandlers[e.key]) {
		keyHandlers[e.key]();
		itemRefs.value[activeIndex.value]?.$el.scrollIntoView({ block: 'end' });
		return true;
	}
}

const activate = ({ x, y }) => root.value?.activate({ clientX: x, clientY: y });
const deactivate = () => root.value?.deactivate();

defineExpose({
	activate,
	deactivate,
	onKeyDown,
});
</script>

<style lang="scss" scoped>
.v-list-item {
	min-width: 200px;
	max-height: none;
	padding-left: 2px;
}

.item .v-icon {
	margin-right: 10px;
	border-radius: var(--border-radius-outline);
	border: solid 1px var(--border-normal);
	padding: 4px;
	width: 28px;
	height: 28px;
}

.group {
	padding: 4px 0;
}

.group-title {
	padding: 0 4px;
}
</style>
