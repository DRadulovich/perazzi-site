import { defineField, defineType } from "sanity";

const STEP_IDS = [
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

export const configuratorSidebarCard = defineType({
  name: "configuratorSidebarCard",
  title: "Build Configurator Sidebar Card",
  type: "document",
  fields: [
    defineField({
      name: "stepId",
      title: "Step ID",
      type: "string",
      options: { list: STEP_IDS.map((id) => ({ title: id, value: id })) },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "optionValue",
      title: "Option Value",
      description: "Must match the option value used in the build configurator JSON for this step.",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "imageWithMeta",
    }),
    defineField({
      name: "platform",
      title: "Platform",
      type: "string",
    }),
    defineField({
      name: "discipline",
      title: "Discipline",
      type: "string",
    }),
    defineField({
      name: "grade",
      title: "Grade",
      type: "string",
    }),
    defineField({
      name: "gauge",
      title: "Gauge",
      type: "string",
    }),
    defineField({
      name: "trigger",
      title: "Trigger",
      type: "string",
    }),
    defineField({
      name: "side",
      title: "Side / Orientation",
      type: "string",
    }),
    defineField({
      name: "order",
      title: "Sort Order",
      type: "number",
      description: "Lower numbers appear first within the step.",
    }),
  ],
  preview: {
    select: {
      title: "optionValue",
      subtitle: "stepId",
      media: "image",
    },
    prepare(selection) {
      const { title, subtitle, media } = selection;
      return {
        title: title || "(untitled)",
        subtitle: subtitle ? `Step: ${subtitle}` : "No step",
        media,
      };
    },
  },
});
