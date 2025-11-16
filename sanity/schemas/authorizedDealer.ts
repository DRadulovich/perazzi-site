import { defineField, defineType } from "sanity";

export const authorizedDealer = defineType({
  name: "authorizedDealer",
  title: "Authorized Dealers",
  type: "document",
  fields: [
    defineField({
      name: "dealerName",
      title: "Dealer Name",
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
      description: "Use the full city line including state abbreviation and ZIP (e.g. Houston, TX 77043).",
      type: "string",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: "dealerName",
      subtitle: "state",
    },
  },
});
