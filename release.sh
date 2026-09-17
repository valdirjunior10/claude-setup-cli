#!/usr/bin/env bash
# Uso: ./release.sh [patch|minor|major] ["mensagem de commit"]
# Padrão: patch, "chore: release"
set -euo pipefail

BUMP="${1:-patch}"
MSG="${2:-chore: release}"

if [[ "$BUMP" != "patch" && "$BUMP" != "minor" && "$BUMP" != "major" ]]; then
  echo "Uso: ./release.sh [patch|minor|major] [\"mensagem de commit\"]"
  exit 1
fi

if [[ -n $(git status --porcelain) ]]; then
  echo "==> Adicionando e commitando mudanças..."
  git add .
  git commit -m "$MSG"
else
  echo "==> Nada para commitar, seguindo direto pro bump de versão."
fi

echo "==> Subindo versão ($BUMP)..."
npm version "$BUMP"

echo "==> Enviando para o GitHub (commit + tag)..."
git push --follow-tags

echo ""
echo "Pronto. Confira a aba Actions do repositório no GitHub para ver o publish rodar."
