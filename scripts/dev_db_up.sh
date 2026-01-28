#!/usr/bin/env bash
set -e

echo "🚀 Levantando Postgres (rowi-db)..."

docker ps --filter name=rowi-db --format '{{.Names}}' | grep -q "rowi-db" \
  && echo "✅ Postgres ya está corriendo" \
  || docker run --name rowi-db \
      -e POSTGRES_USER=postgres \
      -e POSTGRES_PASSWORD=postgres \
      -e POSTGRES_DB=rowi \
      -p 5432:5432 \
      -v rowi_pg:/var/lib/postgresql/data \
      -d postgres:16

echo "✅ Base de datos lista en localhost:5432"

