// src/sanity/schemas/post.ts
import { defineType, defineField } from "sanity";

const post = defineType({
  name: "post",
  title: "Post",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Título", type: "string" }),
    defineField({ name: "author", title: "Autor", type: "string" }),
    defineField({ name: "content", title: "Contenido", type: "text" }),
    defineField({
      name: "createdAt",
      title: "Fecha de creación",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
  ],
});

export default post;