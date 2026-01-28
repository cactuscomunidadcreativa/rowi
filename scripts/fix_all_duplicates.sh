#!/bin/bash
echo "🧹 Limpieza global de rutas duplicadas en Rowi (Cactus 2.0)..."

# 1️⃣ Buscar y corregir patrones comunes duplicados
patterns=(
  "@/domains/eq/domains/eq/lib/eqLevels:@/domains/eq/lib/eqLevels"
  "@/domains/eq/domains:@/domains/eq"
  "@/domains/affinity/domains:@/domains/affinity"
  "@/core/core:@/core"
  "@/ai/ai:@/ai"
  "@/i18n/i18n:@/i18n"
)

for pattern in "${patterns[@]}"; do
  from="${pattern%%:*}"
  to="${pattern##*:}"
  echo "🔧 Corrigiendo '$from' → '$to' ..."
  grep -R "$from" src | cut -d: -f1 | sort | uniq | while read -r file; do
    if [ -f "$file" ]; then
      sed -i '' "s|$from|$to|g" "$file"
      echo "   ✅ Reparado en: $file"
    fi
  done
done

# 2️⃣ Confirmación final
echo "------------------------------------------"
echo "✅ Limpieza completada."
echo "Verifica con: grep -R 'domains/eq/domains' src | cut -d: -f1 | sort | uniq"
echo "------------------------------------------"
