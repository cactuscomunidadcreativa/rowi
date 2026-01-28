import fs from "fs";
import path from "path";
import csv from "csv-parser";

export async function loadEmotionLexicon() {
  const filePath = path.join(process.cwd(), "src/data/emotions/VOCABULARIO_EMOCIONES.csv");
  const results: Record<string, any>[] = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", reject);
  });
}
