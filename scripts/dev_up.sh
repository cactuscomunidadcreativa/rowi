#!/usr/bin/env bash
set -e

echo "🧪 Verificando variables de entorno..."
REQUIRED=("DATABASE_URL" "AUTH_SECRET" "NEXTAUTH_URL" "OPENAI_API_KEY")
MISSING=()
for key in "${REQUIRED[@]}"; do
  if ! grep -q "^${key}=" .env.local 2>/dev/null && ! grep -q "^${key}=" .env 2>/dev/null; then
    MISSING+=("$key")
  fi
done
if [ ${#MISSING[@]} -gt 0 ]; then
  echo "❌ Faltan variables: ${MISSING[*]}"
  exit 1
fi
echo "✅ Variables OK"

echo "🔄 Generando Prisma client..."
npx prisma generate

echo "📦 Aplicando migraciones..."
npx prisma migrate dev --name auto-migrate || true

echo "🚀 Levantando Next.js en http://localhost:3000"
npm run dev
