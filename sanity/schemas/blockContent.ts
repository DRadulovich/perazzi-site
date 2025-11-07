import { defineArrayMember, defineType } from "sanity";

export const blockContent = defineType({
  name: "blockContent",
  title: "Portable Text",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
    }),
    defineArrayMember({
      type: "image",
      options: { hotspot: true },
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alt text",
        },
        {
          name: "caption",
          type: "string",
          title: "Caption",
        },
      ],
    }),
  ],
});
