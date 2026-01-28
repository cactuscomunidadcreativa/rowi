import { defineType, defineField } from "sanity";

export const eqModule = defineType({
  name: "eqModule",
  title: "Módulo EQ",
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "Título del módulo",
      type: "string",
    }),
    defineField({
      name: "description",
      title: "Descripción",
      type: "text",
    }),
  ],
});