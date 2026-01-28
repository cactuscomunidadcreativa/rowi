// src/sanity/schemas/index.ts
// src/sanity/schemas/index.ts

import post from "./post";   // Documento tipo "Post"
import page from "./page";   // Documento tipo "Page"

// Bloques reutilizables (cada archivo dentro de /blocks)
import { heroBlock } from "./blocks/heroBlock";
import { markdownBlock } from "./blocks/markdownBlock";
import { simpleGridBlock } from "./blocks/simpleGridBlock";
import { eqModule } from "./blocks/eqModule";
import { communityModule } from "./blocks/communityModule";

const schemas = [
  // Documentos
  post,
  page,

  // Bloques
  heroBlock,
  markdownBlock,
  simpleGridBlock,
  eqModule,
  communityModule,
];

export default schemas;