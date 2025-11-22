import { defineField, defineType } from "sanity";

const STEP_FIELDS = [
  "FRAME_SIZE",
  "PLATFORM",
  "DISCIPLINE",
  "MODEL",
  "TRIGGER_TYPE",
  "GRADE",
  "ENGRAVING",
  "ACTION_FINISH",
  "GAUGE",
  "LENGTH",
  "WEIGHT",
  "CHOKE_TYPE",
  "B1_CHOKE",
  "B2_CHOKE",
  "CHAMBER_LENGTH",
  "BORE_DIAMETER",
  "MONOBLOC",
  "SIDERIBS_LENGTH",
  "SIDERIBS_VENTILATION",
  "BEAD_FRONT",
  "BEAD_FRONT_COLOR",
  "BEAD_FRONT_STYLE",
  "BEAD_MID",
  "RIB_TYPE",
  "RIB_HEIGHT",
  "RIB_STYLE",
  "RIB_TRAMLINE",
  "RIB_TRAMLINE_SIZE",
  "RIB_TAPER_12",
  "RIB_TAPER_20",
  "RIB_TAPER_28_410",
  "RIB_TAPER_SXS",
  "TRIGGER_GROUP_SPRINGS",
  "TRIGGER_GROUP_SELECTIVE",
  "TRIGGER_GROUP_SAFETY",
  "WOOD_UPGRADE",
  "FOREND_SHAPE",
  "FOREND_CHECKER",
  "STOCK_PROFILE",
];

export const buildConfigurator = defineType({
  name: "buildConfigurator",
  title: "Build Configurator",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "Internal label for this configurator set (e.g., 'Default Concierge Config').",
    }),
    ...STEP_FIELDS.map((fieldId) =>
      defineField({
        name: fieldId,
        title: fieldId,
        type: "array",
        of: [{ type: "reference", to: [{ type: "configuratorSidebarCard" }] }],
        description: `Cards for ${fieldId}. Option values must match the build configurator JSON for this step.`,
      }),
    ),
  ],
  preview: {
    select: { title: "title" },
    prepare(selection) {
      return { title: selection.title || "Build Configurator" };
    },
  },
});
