#!/bin/bash
echo "🧩 Pasada final v5 — Corrigiendo rutas duplicadas y restos de ../lib y src/lib..."

files=$(grep -R "lib/" src/app | cut -d: -f1 | sort | uniq)

for file in $files; do
  echo "🔧 Revisando $file"

  echo "— Antes —"
  grep "lib/" "$file" || echo "(sin coincidencias)"

  # 1️⃣ Eliminar prefijos duplicados (ej. domains/eq/domains/eq/lib)
  sed -i '' 's|domains/eq/domains/eq/lib|domains/eq/lib|g' "$file"

  # 2️⃣ Reemplazar rutas relativas residuales
  sed -i '' 's|\.\./\.\./\.\./lib/affinity/engine|@/domains/affinity/lib/affinityEngine|g' "$file"
  sed -i '' 's|\.\./\.\./\.\./lib/eqLevels|@/domains/eq/lib/eqLevels|g' "$file"
  sed -i '' 's|\.\./\.\./lib/base-url|@/core/utils/base-url|g' "$file"
  sed -i '' 's|\.\./\.\./\.\./lib/i18n|@/i18n|g' "$file"
  sed -i '' 's|\.\./\.\./\.\./lib/prisma|@/core/prisma|g' "$file"

  # 3️⃣ Corrige referencias a lib/useTR
  sed -i '' 's|\.\./lib/useTR|@/core/utils/useTR|g' "$file"
  sed -i '' 's|../lib/useTR|@/core/utils/useTR|g' "$file"

  # 4️⃣ Corrige cualquier src/lib
  sed -i '' 's|src/lib/|@/core/|g' "$file"

  echo "— Después —"
  grep "lib/" "$file" || echo "✅ Limpio"
  echo "--------------------------------------------"
done

echo "🎉 Limpieza v5 completada. Verifica con:"
echo "grep -R 'lib/' src/app | cut -d: -f1 | sort | uniq"
