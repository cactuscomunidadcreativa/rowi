#!/bin/bash
echo "🧹 Pasada final inteligente (v4) — detectando y corrigiendo rutas restantes con lib/ ..."

# Buscar todos los archivos con 'lib/'
files=$(grep -R "lib/" src/app | cut -d: -f1 | sort | uniq)

for file in $files; do
  echo "🔧 Analizando $file"

  # Mostrar líneas originales antes de modificar
  echo "—— Antes ——"
  grep "lib/" "$file" || echo "(sin coincidencias previas)"

  # Sustituciones robustas (soporta comillas simples, dobles o sin ellas)
  sed -i '' -E '
    s|(["'\''])@?/lib/ai/|\1@/ai/|g;
    s|(["'\''])@?/lib/eq|\1@/domains/eq/lib|g;
    s|(["'\''])@?/lib/i18n|\1@/i18n|g;
    s|(["'\''])@?/lib/prisma|\1@/core/prisma|g;
    s|(["'\''])@?/lib/auth|\1@/core/auth|g;
    s|(["'\''])@?/lib/utils|\1@/core/utils|g;
    s|\.\./\.\./lib/ai/|@/ai/|g;
    s|\.\./\.\./lib/eq|@/domains/eq/lib|g;
    s|\.\./\.\./lib/i18n|@/i18n|g;
    s|\.\./\.\./lib/prisma|@/core/prisma|g;
    s|\.\./\.\./lib/auth|@/core/auth|g;
    s|\.\./\.\./lib/utils|@/core/utils|g;
  ' "$file"

  # Mostrar resultado tras corrección
  echo "—— Después ——"
  grep "lib/" "$file" || echo "✅ Limpio"
  echo "-----------------------------------"
done

echo "🎯 Limpieza completa. Vuelve a verificar con: grep -R 'lib/' src/app | cut -d: -f1 | sort | uniq"
