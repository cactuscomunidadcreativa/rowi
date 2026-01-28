// scripts/scan-ai.mjs
import fs from "fs";
import path from "path";

const ROOT = path.resolve(process.cwd(), "src");
const needles = [
  "openai", "chat.completions", "ai.audio.speech",
  "audio.transcriptions", "whisper-1", "/api/rowi",
  "gpt-4o", "gpt-4o-mini"
];

function scan(file, hits){
  if (fs.statSync(file).isDirectory()){
    for (const f of fs.readdirSync(file)){
      if (["node_modules",".next",".git"].includes(f)) continue;
      scan(path.join(file,f),hits);
    }
    return;
  }
  if (!/\.(ts|tsx|js|mjs)$/.test(file)) return;
  const lines = fs.readFileSync(file,"utf8").split("\n");
  needles.forEach(n=>{
    lines.forEach((ln,i)=>{
      if (ln.includes(n)) hits.push({file,line:i+1,text:ln.trim()});
    });
  });
}

const hits=[];
scan(ROOT,hits);
if(!hits.length){console.log("✅ No IA refs");}
else{
  console.log("⚠️  Referencias IA:");
  hits.forEach(h=>console.log(`${h.file}:${h.line}  ${h.text}`));
}