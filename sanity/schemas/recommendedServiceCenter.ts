import { defineField, defineType } from "sanity";

export const recommendedServiceCenter = defineType({
  name: "recommendedServiceCenter",
  title: "Recommended Service Centers",
  type: "document",
  fields: [
    defineField({
      name: "centerName",
      title: "Center Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "state",
      title: "State",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "address",
      title: "Address",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "city",
      title: "City",
      description: "Use the full city line including state abbreviation and ZIP.",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "phone",
      title: "Phone",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "contact",
      title: "Contact",
      type: "string",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: "centerName",
      subtitle: "state",
    },
  },
});
