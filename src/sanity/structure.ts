import type { StructureResolver } from "sanity/structure";

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) => {
  const docListItem = (type: string, title?: string) => {
    const base = title ? S.documentTypeListItem(type).title(title) : S.documentTypeListItem(type);

    if (type === "allModels") {
      return base.child(
        S.documentTypeList("allModels")
          .title(title ?? "All models")
          .defaultOrdering([{ field: "name", direction: "asc" }]),
      );
    }

    return base;
  };

  const handledTypes = new Set([
    "homeSingleton",
    "shotgunsLanding",
    "platform",
    "discipline",
    "gauge",
    "grade",
    "champion",
    "bespokeHome",
    "experienceHome",
    "buildConfigurator",
    "configuratorSidebarCard",
    "heritageHome",
    "article",
    "journalLanding",
    "author",
    "heritageEvent",
    "factoryAsset",
    "serviceHome",
    "engravings",
    "authorizedDealer",
    "recommendedServiceCenter",
    "manufactureYear",
    "scheduledEvent",
    "allModels",
    "siteSettings",
  ]);

  const fieldGroup = S.listItem()
    .title("Field")
    .child(
      S.list()
        .title("Field")
        .items([
          docListItem("homeSingleton", "Home"),
          docListItem("shotgunsLanding", "Shotguns landing"),
          docListItem("platform", "Platforms"),
          docListItem("discipline", "Disciplines"),
          docListItem("gauge", "Gauges"),
          docListItem("grade", "Grades"),
          docListItem("champion", "Champions"),
        ]),
    );

  const atelierGroup = S.listItem()
    .title("Atelier")
    .child(
      S.list()
        .title("Atelier")
        .items([
          docListItem("bespokeHome", "Bespoke"),
          docListItem("experienceHome", "Experience"),
          docListItem("buildConfigurator", "Configurator"),
          docListItem("configuratorSidebarCard", "Configurator sidebar cards"),
        ]),
    );

  const archiveGroup = S.listItem()
    .title("Archive")
    .child(
      S.list()
        .title("Archive")
        .items([
          docListItem("heritageHome", "Heritage"),
          docListItem("heritageEvent", "Heritage events"),
          docListItem("journalLanding", "Journal landing"),
          docListItem("article", "Journal article"),
          docListItem("author", "Authors"),
          docListItem("factoryAsset", "Factory assets"),
        ]),
    );

  const workshopGroup = S.listItem()
    .title("Workshop")
    .child(
      S.list()
        .title("Workshop")
        .items([
          docListItem("serviceHome", "Service"),
          docListItem("engravings", "Engravings"),
          docListItem("authorizedDealer", "Authorized dealers"),
          docListItem("recommendedServiceCenter", "Service centers"),
          docListItem("manufactureYear", "Manufacture years"),
          docListItem("scheduledEvent", "Scheduled events"),
          docListItem("allModels", "Model lookup (all models)"),
        ]),
    );

  const otherItems = S.documentTypeListItems().filter((listItem) => {
    const id = listItem.getId() || "";
    return !handledTypes.has(id);
  });

  const systemGroup =
    otherItems.length > 0 || handledTypes.has("siteSettings")
      ? S.listItem()
          .title("Other / System")
          .child(
            S.list()
              .title("Other / System")
              .items([docListItem("siteSettings", "Site settings"), ...otherItems]),
          )
      : null;

  return S.list()
    .title("Content")
    .items([fieldGroup, atelierGroup, archiveGroup, workshopGroup, ...(systemGroup ? [systemGroup] : [])]);
};
