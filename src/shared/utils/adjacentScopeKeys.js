/**
 * Adjacent key in an ordered list (no wrap). Used by Tour Date / scope steppers.
 *
 * @template T
 * @param {T[]} items
 * @param {string | null | undefined} currentKey
 * @param {(item: T) => string} getKey
 * @returns {{ index: number, prevKey: string | null, nextKey: string | null }}
 */
export function adjacentScopeKeys(items, currentKey, getKey) {
  if (!Array.isArray(items) || items.length === 0) {
    return { index: -1, prevKey: null, nextKey: null };
  }
  const index = items.findIndex((item) => getKey(item) === currentKey);
  if (index < 0) {
    return { index: -1, prevKey: null, nextKey: null };
  }
  return {
    index,
    prevKey: index > 0 ? getKey(items[index - 1]) : null,
    nextKey: index < items.length - 1 ? getKey(items[index + 1]) : null,
  };
}
