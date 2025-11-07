import { DEFAULT_FILTER_STATE, JOURNAL_SORTS } from "./filters";
import type { JournalFilterState, JournalSortValue } from "./filters";

type SearchParamsRecord = Record<
  string,
  string | string[] | undefined
>;

const VALID_SORTS = new Set<JournalSortValue>(
  JOURNAL_SORTS.map((option) => option.value),
);

const getParamValue = (searchParams: SearchParamsRecord | undefined, key: string) => {
  if (!searchParams) return null;
  const value = searchParams[key];
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
};

export function parseCategorySearchParams(searchParams?: SearchParamsRecord): {
  filters: JournalFilterState;
  page: number;
} {
  const sortCandidate = getParamValue(searchParams, "sort");
  const sort = VALID_SORTS.has(sortCandidate as JournalSortValue)
    ? (sortCandidate as JournalSortValue)
    : DEFAULT_FILTER_STATE.sort;

  const tag = getParamValue(searchParams, "tag") ?? DEFAULT_FILTER_STATE.tag;
  const author = getParamValue(searchParams, "author") ?? DEFAULT_FILTER_STATE.author;

  const pageRaw = Number.parseInt(getParamValue(searchParams, "page") ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  return {
    filters: { sort, tag, author },
    page,
  };
}
