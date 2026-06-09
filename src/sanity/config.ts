import { defineConfig } from "sanity";
import { deskTool } from "sanity/desk";
import schemas from "./schemas";   // 👈 aquí importamos el default, no { schemas }

export default defineConfig({
  name: "default",
  title: "Rowi",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  basePath: "/studio",
  plugins: [deskTool()],
  schema: {
    types: schemas,   // 👈 usamos schemas directo
  },
});