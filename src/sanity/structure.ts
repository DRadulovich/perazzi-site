import type { StructureResolver } from "sanity/desk";

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) => {
  const listItems = S.documentTypeListItems().map((listItem) => {
    if (listItem.getId() === "models") {
      return listItem.child(
        S.documentTypeList("models").defaultOrdering([{ field: "s_model_name", direction: "asc" }]),
      );
    }
    return listItem;
  });

  return S.list().title("Content").items(listItems);
};
