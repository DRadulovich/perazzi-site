export type OptionInfoResult<T> = {
  option: string;
  items: T[];
};

export type MergeInfoCacheResult<T> = {
  map: Record<string, T[]>;
  flat: T[];
};

export function mergeOptionResults<T>(results: Array<OptionInfoResult<T>>): MergeInfoCacheResult<T> {
  const map: Record<string, T[]> = {};
  const flat: T[] = [];
  results.forEach(({ option, items }) => {
    map[option] = items;
    flat.push(...items);
  });
  return { map, flat };
}
