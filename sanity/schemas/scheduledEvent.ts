import { defineField, defineType } from "sanity";

export const scheduledEvent = defineType({
  name: "scheduledEvent",
  title: "Scheduled Events",
  type: "document",
  fields: [
    defineField({
      name: "eventName",
      title: "Event Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "eventLocation",
      title: "Event Location",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "startDate",
      title: "Start Date",
      type: "date",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "endDate",
      title: "End Date",
      type: "date",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "location",
      title: "Location",
      description: "Full address for the event",
      type: "string",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: "eventName",
      subtitle: "eventLocation",
    },
  },
});
