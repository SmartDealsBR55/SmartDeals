#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
npm ci
npm run build

cp dist/index.source.html index.html
cp dist/pages/login.source.html pages/login.html
cp dist/pages/admin.source.html pages/admin.html
cp dist/pages/politica.source.html pages/politica.html
cp dist/pages/quem-somos.source.html pages/quem-somos.html
cp -a dist/assets/. assets/

rm -f SmartDeals-atualizacao.zip SmartDeals-painel-celular.zip SmartDeals-correcao-importacao.zip SmartDeals-categorias-compactas.zip SmartDeals-sem-rolagem-lateral.zip SmartDeals-ajuste-largura.zip
git add -A
if git diff --cached --quiet; then
  echo 'Nenhuma alteração nova para enviar.'
  exit 0
fi

git commit -m 'Habilitar painel, produtos e layout mobile'
git push
