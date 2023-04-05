import type { ComputedGetter, Ref, WatchOptions, WatchSource } from 'vue';
import { readonly, ref, watch } from 'vue';

/**
 * A controlled computable that updates if the watch source changes.
 * This is currently not lazy (it will be executed at least once)
 */
export function controlledComputed<S, T>(
	source: WatchSource<S> | WatchSource<S>[],
	fn: ComputedGetter<T>,
	options: WatchOptions = {}
): Readonly<Ref<T>> {
	const v = ref<T>(undefined);

	watch(source, () => (v.value = fn()), { flush: 'sync', immediate: true, ...options });
	return readonly(v);
}
