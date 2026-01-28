#!/bin/bash
echo "🧠 Tercera pasada — limpieza inteligente de imports restantes (lib/...)"

# Buscar todos los archivos con "lib/"
files=$(grep -R "lib/" src/app | cut -d: -f1 | sort | uniq)

for file in $files; do
  echo "🔍 Revisando: $file"

  # Ajustes automáticos según contexto
  sed -i '' 's|@/lib/ai/|@/ai/|g' "$file"
  sed -i '' 's|\.\./\.\./lib/ai/|@/ai/|g' "$file"
  sed -i '' 's|\.\./\.\./\.\./lib/ai/|@/ai/|g' "$file"

  sed -i '' 's|@/lib/eq|@/domains/eq/lib|g' "$file"
  sed -i '' 's|\.\./\.\./lib/eq|@/domains/eq/lib|g' "$file"
  sed -i '' 's|\.\./\.\./\.\./lib/eq|@/domains/eq/lib|g' "$file"

  sed -i '' 's|@/lib/i18n|@/i18n|g' "$file"
  sed -i '' 's|\.\./\.\./lib/i18n|@/i18n|g' "$file"
  sed -i '' 's|\.\./\.\./\.\./lib/i18n|@/i18n|g' "$file"

  sed -i '' 's|@/lib/prisma|@/core/prisma|g' "$file"
  sed -i '' 's|\.\./\.\./\.\./\.\./lib/prisma|@/core/prisma|g' "$file"
  sed -i '' 's|\.\./\.\./\.\./lib/prisma|@/core/prisma|g' "$file"

  sed -i '' 's|@/lib/auth|@/core/auth|g' "$file"
  sed -i '' 's|\.\./\.\./lib/auth|@/core/auth|g' "$file"
  sed -i '' 's|\.\./\.\./\.\./lib/auth|@/core/auth|g' "$file"

  sed -i '' 's|@/lib/utils|@/core/utils|g' "$file"
  sed -i '' 's|\.\./\.\./lib/utils|@/core/utils|g' "$file"

  echo "✅ Corrigido: $file"
done

echo "🎉 Limpieza completada. Verifica con: grep -R \"lib/\" src/app | cut -d: -f1 | sort | uniq"
