#!/bin/bash
# Hook PostToolUse (matcher: Write|Edit) — bloqueia migration sem rollback
# depois de escrita, obrigando a corrigir antes de seguir.
# Heurística hoje é Laravel-flavored (up/down); adapte pra outro framework
# se a convenção de migration for diferente (ex: Rails change(), Django
# migrations reversíveis automaticamente).
set -euo pipefail

INPUT=$(cat)

if command -v jq >/dev/null 2>&1; then
  FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
else
  FILE_PATH=$(echo "$INPUT" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"file_path"[[:space:]]*:[[:space:]]*"//;s/"$//')
fi

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

case "$FILE_PATH" in
  *migration*|*Migrations*) ;;
  *) exit 0 ;;
esac

if [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

if grep -q "function up" "$FILE_PATH" 2>/dev/null && ! grep -q "function down" "$FILE_PATH" 2>/dev/null; then
  echo "Bloqueado: '$FILE_PATH' tem 'up' mas não tem 'down' — toda migration precisa de rollback (ver .claude/rules/convencoes.md)." >&2
  exit 2
fi

exit 0
