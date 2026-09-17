#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
npm ci
npm run build

cp dist/index.source.html index.html
cp dist/pages/login.source.html pages/login.html
cp dist/pages/admin.source.html pages/admin.html
cp -a dist/assets/. assets/

rm -f SmartDeals-atualizacao.zip
git add -A
if git diff --cached --quiet; then
  echo 'Nenhuma alteração nova para enviar.'
  exit 0
fi

git commit -m 'Habilitar painel, produtos e layout mobile'
git push
