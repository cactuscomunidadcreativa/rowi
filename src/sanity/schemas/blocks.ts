import { defineType, defineField } from "sanity";

// ——— Bloques de contenido genérico ———
export const heroBlock = defineType({
  name: "heroBlock",
  title: "Hero",
  type: "object",
  fields: [
    defineField({ name: "title", title: "Título", type: "string" }),
    defineField({ name: "subtitle", title: "Subtítulo", type: "text" }),
    defineField({ name: "ctaLabel", title: "CTA label", type: "string" }),
    defineField({ name: "ctaHref", title: "CTA link", type: "string" }),
  ],
});

export const markdownBlock = defineType({
  name: "markdownBlock",
  title: "Markdown",
  type: "object",
  fields: [defineField({ name: "body", title: "Contenido (Markdown)", type: "text" })],
});

// ——— Módulos “Rowi” ———
export const eqModule = defineType({
  name: "eqModule",
  title: "Módulo: EQ (barra)",
  type: "object",
  fields: [
    defineField({
      name: "userId",
      title: "ID de usuario (de seeds, demo)",
      type: "string",
      description: "Por ahora demo: id de src/data/seeds/users.json (ej: 'u1')",
    }),
    defineField({
      name: "view",
      title: "Vista",
      type: "string",
      options: { list: ["actual", "history", "feedback"] },
      initialValue: "actual",
    }),
    defineField({ name: "title", title: "Título del bloque", type: "string", initialValue: "Perfil de EQ" }),
  ],
});

export const communityModule = defineType({
  name: "communityModule",
  title: "Módulo: Comunidad (listado)",
  type: "object",
  fields: [
    defineField({ name: "title", title: "Título", type: "string", initialValue: "Comunidad" }),
    defineField({
      name: "topic",
      title: "Filtrar por tema (opcional)",
      type: "string",
      options: { list: ["Colaboración", "Gestión del estrés", "Liderazgo", "Comunicación"] },
    }),
    defineField({ name: "limit", title: "Cantidad", type: "number", initialValue: 5 }),
  ],
});

export const simpleGridBlock = defineType({
  name: "simpleGridBlock",
  title: "Grid simple",
  type: "object",
  fields: [
    defineField({
      name: "items",
      title: "Items",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "title", title: "Título", type: "string" }),
            defineField({ name: "text", title: "Texto", type: "text" }),
          ],
        },
      ],
    }),
  ],
});