import { defineField, defineType } from "sanity";

export const manufactureYear = defineType({
  name: "manufactureYear",
  title: "Manufacture Year",
  type: "document",
  fields: [
    defineField({
      name: "year",
      title: "Year",
      type: "number",
      validation: (rule) => rule.required().integer().min(1900),
    }),
    defineField({
      name: "proofCode",
      title: "Proof Code",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "primaryRange",
      title: "Primary Serial Range",
      type: "object",
      description:
        "Set the lowest serial for the year and, if known, the final serial. Leave End empty for 'onward' ranges.",
      fields: [
        defineField({
          name: "start",
          title: "Start",
          type: "number",
          description: "Lowest serial number for the year",
          validation: (rule) => rule.required().min(0),
        }),
        defineField({
          name: "end",
          title: "End",
          type: "number",
          description: "Optional upper bound",
        }),
      ],
      validation: (rule) =>
        rule
          .required()
          .custom((value) => {
            if (!value?.start && value?.start !== 0) {
              return "Enter the first serial number for the range.";
            }
            if (value.end !== undefined && value.end !== null && value.end < value.start) {
              return "End serial must be greater than start.";
            }
            return true;
          }),
    }),
    defineField({
      name: "specialRanges",
      title: "Model Serial Ranges",
      type: "array",
      of: [
        defineField({
          name: "modelRange",
          type: "object",
          fields: [
            defineField({
              name: "model",
              title: "Model",
              type: "string",
              description: "Model label, e.g. MT6 or TM",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "rangeStart",
              title: "Range Start",
              type: "number",
              validation: (rule) => rule.required().min(0),
            }),
            defineField({
              name: "rangeEnd",
              title: "Range End",
              type: "number",
            }),
          ],
          validation: (rule) =>
            rule.custom((value) => {
              if (!value || typeof value !== "object") return true;
              const { rangeStart, rangeEnd } = value as {
                rangeStart?: number;
                rangeEnd?: number | null;
              };
              if (rangeEnd !== undefined && rangeEnd !== null && rangeStart !== undefined && rangeEnd < rangeStart) {
                return "Range end must be greater than start.";
              }
              return true;
            }),
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "year",
      subtitle: "proofCode",
    },
    prepare(selection) {
      return {
        title: selection.title?.toString() ?? "Year",
        subtitle: selection.subtitle ? `Proof ${selection.subtitle}` : undefined,
      };
    },
  },
});
