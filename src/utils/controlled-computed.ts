import type { ComputedGetter, Ref, WatchSource } from 'vue';
import { readonly, ref, watch } from 'vue';

/**
 * A controlled computable that updates if the watch source changes.
 * This is currently not lazy (it will be executed at least once)
 * @param source
 * @param fn
 */
export function controlledComputed<S, T>(
	source: WatchSource<S> | WatchSource<S>[],
	fn: ComputedGetter<T>
): Readonly<Ref<T>> {
	const v = ref<T>(undefined);

	watch(source, () => (v.value = fn()), { flush: 'sync', immediate: true });
	return readonly(v);
}
