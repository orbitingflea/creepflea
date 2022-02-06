export function ensureArray<T>(x: T | T[] | null | undefined): T[] {
  return (x === null || x === undefined) ? [] : Array.isArray(x) ? x : [x];
}
