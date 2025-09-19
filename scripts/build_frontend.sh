#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FE_DIR="$ROOT_DIR/frontend"
PY_STATIC_DIR="$ROOT_DIR/python-backend/app/static"

echo "[1/3] Building React app..."
cd "$FE_DIR"
npm install
npm run build

echo "[2/3] Preparing static directory..."
rm -rf "$PY_STATIC_DIR"
mkdir -p "$PY_STATIC_DIR"

echo "[3/3] Copying build to python-backend/app/static ..."
cp -R "$FE_DIR/dist/"* "$PY_STATIC_DIR/"

echo "Done. Static files available at $PY_STATIC_DIR"
