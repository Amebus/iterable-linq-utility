/**
 * Options of `collectToMap`.
 * @since next
 */
export interface ICollectToMapOptions<K, V> {
	/**
	 * Called when a key is already in the map, with the value stored, the value selected from the new element and the key;
	 * returns the value to store. Without it, the new value replaces the one stored.
	 */
	merge?: (existing: V, incoming: V, key: K) => V;
}
