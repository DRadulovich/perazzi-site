import { defineField, defineType } from "sanity";

export const models = defineType({
  name: "models",
  title: "Models",
  type: "document",
  fields: [
    defineField({
      name: "s_model_name",
      title: "Model Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "s_version_id",
      title: "Version ID",
      type: "string",
    }),
    defineField({
      name: "s_platform_id",
      title: "Platform",
      type: "reference",
      to: [{ type: "platform" }],
    }),
    defineField({
      name: "s_image_local_path",
      title: "Image",
      type: "imageWithMeta",
    }),
    defineField({
      name: "s_gauge_id_1",
      title: "Gauge 1",
      type: "reference",
      to: [{ type: "gauge" }],
    }),
    defineField({
      name: "s_gauge_id_2",
      title: "Gauge 2",
      type: "reference",
      to: [{ type: "gauge" }],
    }),
    defineField({
      name: "s_gauge_id_3",
      title: "Gauge 3",
      type: "reference",
      to: [{ type: "gauge" }],
    }),
    defineField({
      name: "s_gauge_id_4",
      title: "Gauge 4",
      type: "reference",
      to: [{ type: "gauge" }],
    }),
    defineField({
      name: "s_gauge_id_5",
      title: "Gauge 5",
      type: "reference",
      to: [{ type: "gauge" }],
    }),
    defineField({
      name: "s_trigger_type_id_1",
      title: "Trigger Type 1",
      type: "string",
    }),
    defineField({
      name: "s_trigger_type_id_2",
      title: "Trigger Type 2",
      type: "string",
    }),
    defineField({
      name: "s_trigger_spring_id_1",
      title: "Trigger Spring 1",
      type: "string",
    }),
    defineField({
      name: "s_trigger_spring_id_2",
      title: "Trigger Spring 2",
      type: "string",
    }),
    defineField({
      name: "s_rib_type_id_1",
      title: "Rib Type 1",
      type: "string",
    }),
    defineField({
      name: "s_rib_type_id_2",
      title: "Rib Type 2",
      type: "string",
    }),
    defineField({
      name: "s_rib_style_id_1",
      title: "Rib Style 1",
      type: "string",
    }),
    defineField({
      name: "s_rib_style_id_2",
      title: "Rib Style 2",
      type: "string",
    }),
    defineField({
      name: "s_rib_style_id_3",
      title: "Rib Style 3",
      type: "string",
    }),
    defineField({
      name: "s_rib_style_id_4",
      title: "Rib Style 4",
      type: "string",
    }),
    defineField({
      name: "s_use_id",
      title: "Use",
      type: "string",
    }),
    defineField({
      name: "s_grade_id",
      title: "Grade",
      type: "reference",
      to: [{ type: "grade" }],
    }),
  ],
  preview: {
    select: {
      title: "s_model_name",
      subtitle: "s_platform_id.name",
      media: "s_image_local_path",
    },
  },
});
