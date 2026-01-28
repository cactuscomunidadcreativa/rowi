import { defineType, defineField } from "sanity";

export const simpleGridBlock = defineType({
  name: "simpleGridBlock",
  title: "Grid simple",
  type: "object",
  fields: [
    defineField({
      name: "items",
      title: "Items",
      type: "array",
      of: [{ type: "string" }],
    }),
  ],
});