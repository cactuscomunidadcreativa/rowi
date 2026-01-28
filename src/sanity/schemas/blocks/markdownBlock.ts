import { defineType, defineField } from "sanity";

export const markdownBlock = defineType({
  name: "markdownBlock",
  title: "Markdown",
  type: "object",
  fields: [
    defineField({
      name: "content",
      title: "Contenido (Markdown)",
      type: "text",
    }),
  ],
});