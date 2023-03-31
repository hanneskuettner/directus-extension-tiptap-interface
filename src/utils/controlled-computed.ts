import type { ComputedGetter, WatchSource } from 'vue';
import {watch} from "vue";

export function controlledComputed<S, T>(source: WatchSource<S> | WatchSource<S>[], fn: ComputedGetter<T>) {
	const v: T = undefined!
	const dirty = ref(true)
	
	const update = () => {
		dirty.value = true
	}
	
	watch(source, update, { flush: 'sync'})
}
