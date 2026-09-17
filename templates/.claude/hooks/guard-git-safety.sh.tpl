#!/bin/bash
# Hook PreToolUse (matcher: Bash) — bloqueia ações de git perigosas
# ANTES de executarem, não depois. Gerado por claude-init.
set -euo pipefail

INPUT=$(cat)

if command -v jq >/dev/null 2>&1; then
  COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
else
  COMMAND=$(echo "$INPUT" | grep -o '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"command"[[:space:]]*:[[:space:]]*"//;s/"$//')
fi

if [ -z "$COMMAND" ]; then
  exit 0
fi

# Bloqueia push forçado — se for realmente necessário, rode manualmente
# fora do Claude, não deixe o agente decidir isso sozinho.
if echo "$COMMAND" | grep -qE '(^|[[:space:]])git[[:space:]]+push([[:space:]]+.*)?[[:space:]](--force|--force-with-lease|-f)([[:space:]]|$)'; then
  echo "Bloqueado: push forçado (--force/-f) não é permitido pelo Claude. Se for realmente necessário, rode manualmente." >&2
  exit 2
fi

# Bloqueia push direto na branch de release — promoção {{DEV_BRANCH}} →
# {{RELEASE_BRANCH}} é decisão humana, não deve acontecer sozinha durante
# uma implementação.
if echo "$COMMAND" | grep -qE 'git[[:space:]]+push[[:space:]]+.*(^|[[:space:]])(origin[[:space:]]+)?{{RELEASE_BRANCH}}([[:space:]]|$)'; then
  echo "Bloqueado: push direto em '{{RELEASE_BRANCH}}' não é permitido pelo Claude. A promoção {{DEV_BRANCH}} → {{RELEASE_BRANCH}} é manual." >&2
  exit 2
fi

exit 0
