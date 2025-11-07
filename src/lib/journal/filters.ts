export const JOURNAL_SORTS = [
  { value: "latest", label: "Latest" },
  { value: "reading", label: "Reading time" },
] as const;

export type JournalSortValue = (typeof JOURNAL_SORTS)[number]["value"];

export type JournalFilterState = {
  sort: JournalSortValue;
  tag: string;
  author: string;
};

export const DEFAULT_FILTER_STATE: JournalFilterState = {
  sort: "latest",
  tag: "",
  author: "",
};

export const JOURNAL_CATEGORY_PAGE_SIZE = 4;
