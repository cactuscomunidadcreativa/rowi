import { defineType, defineField } from "sanity";

export default defineType({
  name: "page",
  title: "Página (builder)",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Título", type: "string" }),
    defineField({
      name: "slug",
      title: "Slug (ruta)",
      type: "slug",
      options: { source: "title", maxLength: 96 },
    }),
    defineField({
      name: "sections",
      title: "Secciones (ordena con drag & drop)",
      type: "array",
      of: [
        { type: "heroBlock" },
        { type: "markdownBlock" },
        { type: "simpleGridBlock" },
        { type: "eqModule" },
        { type: "communityModule" },
      ],
    }),
  ],
});