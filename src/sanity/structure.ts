import type { StructureResolver } from "sanity/desk";

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) => {
  const listItems = S.documentTypeListItems().map((listItem) => {
    if (listItem.getId() === "allModels") {
      return listItem.child(
        S.documentTypeList("allModels").defaultOrdering([{ field: "name", direction: "asc" }]),
      );
    }
    return listItem;
  });

  return S.list().title("Content").items(listItems);
};
