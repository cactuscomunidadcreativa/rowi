#!/bin/zsh
echo "🤖 Reparando imports y verificando integridad de agentes IA (Rowi / Cactus 2.0)..."

# Ruta base
AGENTS_DIR="src/ai/agents"

# Validar existencia
if [ ! -d "$AGENTS_DIR" ]; then
  echo "❌ No se encontró la carpeta $AGENTS_DIR"
  exit 1
fi

# Lista de agentes esperados
EXPECTED_AGENTS=("affinity" "eco" "eq" "sales" "trainer" "super")

# Paso 1️⃣ - Arreglar los imports rotos
echo "🛠️  Corrigiendo imports '../registerUsage' → '../client/registerUsage'..."
find "$AGENTS_DIR" -type f -name "*.ts" -exec sed -i '' 's|../registerUsage|../client/registerUsage|g' {} +

# Paso 2️⃣ - Validar existencia e integridad de los agentes
echo ""
echo "🔍 Verificando agentes IA existentes..."
for agent in $EXPECTED_AGENTS; do
  FILE="$AGENTS_DIR/$agent.ts"

  if [ -f "$FILE" ]; then
    SIZE=$(stat -f%z "$FILE" 2>/dev/null)
    if [ "$SIZE" -lt 50 ]; then
      echo "⚠️  El agente '$agent.ts' existe pero parece vacío o incompleto ($SIZE bytes)"
    else
      # Validar import correcto
      if grep -q "../client/registerUsage" "$FILE"; then
        echo "✅ $agent.ts — OK (import correcto)"
      else
        echo "🚨 $agent.ts — Falta el import correcto de registerUsage"
      fi
    fi
  else
    echo "❌ Falta el agente: $agent.ts"
  fi
done

# Paso 3️⃣ - Confirmación visual
echo ""
echo "📄 Archivos con import corregido:"
grep -l "../client/registerUsage" "$AGENTS_DIR"/*.ts 2>/dev/null || echo "⚠️  Ningún archivo corregido aún."

echo ""
echo "🎯 Validación completa. Revisa las alertas arriba (⚠️ o ❌) antes de continuar con build."
echo ""