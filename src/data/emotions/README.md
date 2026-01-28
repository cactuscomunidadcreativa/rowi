# VOCABULARIO_EMOCIONES.csv
Diccionario emocional usado por Rowi SIA.  
Contiene palabras, categorías e intensidades en español.

### Cómo usarlo
```ts
import { loadEmotionLexicon } from "@/data/emotions";

const emotions = await loadEmotionLexicon();
console.log(emotions.length, "emociones cargadas");
```
