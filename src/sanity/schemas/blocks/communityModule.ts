import { defineType, defineField } from "sanity";

export const communityModule = defineType({
  name: "communityModule",
  title: "Módulo Comunidad",
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