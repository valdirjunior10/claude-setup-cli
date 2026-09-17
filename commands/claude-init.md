---
description: Gera a estrutura Claude Code (orchestrator, agentes por camada, SDD, hooks) neste projeto, conversacionalmente — equivalente ao CLI `claude-init` pra quem não tem Node
---

Você vai reproduzir exatamente o que o CLI Node deste mesmo pacote faz
(`bin/cli.js`), mas fazendo as perguntas em conversa e escrevendo os
arquivos você mesmo com suas ferramentas de arquivo. Os templates estão
em `${CLAUDE_PLUGIN_ROOT}/templates/` — leia cada um antes de escrever o
arquivo final, substituindo os placeholders `{{NOME}}` pelas respostas
abaixo. **Nunca sobrescreva um arquivo que já existe** — avise que
pulou e siga para o próximo.

## 1. Perguntas (uma de cada vez, nesta ordem)

1. Nome do projeto/produto (padrão: nome da pasta atual)
2. É um monorepo com múltiplos apps/pacotes? (sim/não)
3. Se sim: liste os apps/pacotes separados por vírgula
4. Linguagem/framework principal (texto livre)
5. Banco de dados e padrão de arquitetura (texto livre)
6. Mensageria/filas, se houver (pode ficar em branco)
7. Como é feito o deploy (texto livre)
8. Branch principal de desenvolvimento (padrão: `develop`)
9. Branch que dispara o deploy em produção (padrão: `main`)
10. Adicionar automação de versionamento (`/versao` + GitHub Action de
    auto-tag)? (sim/não, padrão sim)
11. Deixar o Claude Code sempre iniciar em Plan Mode neste projeto?
    (sim/não, padrão sim)
12. Adicionar hooks de segurança (bloqueia push forçado, push direto na
    branch de release, migration sem rollback)? (sim/não, padrão sim)
13. Ao finalizar uma implementação aprovada pelo reviewer, o orchestrator
    deve: fazer merge direto, ou abrir Pull Request e parar?
14. O que mais gerar: subagentes, regras, slash commands, esqueleto de
    docs/architecture — pode marcar todos por padrão

## 2. Detecção de agentes por camada

Combine as respostas de linguagem + banco + mensageria em um texto só,
em minúsculas, e procure estas palavras-chave:

- **backend-implementer** se achar: laravel, php, nestjs, node, express,
  django, flask, python, rails, ruby, .net, dotnet, c#, spring, java,
  golang, fastapi, symfony
- **frontend-implementer** se achar: react, vue, angular, svelte,
  next.js, nextjs, nuxt
- **db-migrator** se achar: postgres, postgresql, mysql, mongodb, mongo,
  sqlite, sql server, mariadb, oracle
- **queue-worker** se achar: rabbitmq, kafka, sqs, redis, nats, activemq

Gere um agente (a partir do template correspondente em
`.claude/agents/<nome>-implementer.md.tpl` ou `queue-worker.md.tpl`) pra
cada categoria que bateu. Se nenhuma bateu, gere
`.claude/agents/implementer.md.tpl` genérico. `reviewer.md.tpl` é sempre
gerado. Por fim, gere `orchestrator.md.tpl`, preenchendo `{{AGENTS_LIST}}`
com a lista dos agentes gerados (`- \`nome\` — descrição`).

## 3. Convenção de camadas do backend (models/controllers/services/repositories)

Se detectou backend E (não é monorepo OU só tem um app OU o usuário
apontou qual pasta é o backend): pergunte se quer gerar `CLAUDE.md` por
camada. Se sim, use esta tabela de convenções conhecidas:

- **Laravel** → `app/Models`, `app/Http/Controllers`, `app/Services`,
  `app/Repositories`
- **qualquer outro framework** (sem convenção mapeada ainda) → genérico:
  `src/models`, `src/controllers`, `src/services`, `src/repositories`

Gere `.claude/layer/CLAUDE.layer.md.tpl` em cada um desses caminhos
(relativos à pasta do app de backend, ou à raiz se não for monorepo), e
preencha a seção `{{LAYERS_SECTION}}` do `CLAUDE.md` daquele app com
links `@<caminho>/CLAUDE.md` pra cada camada gerada.

## 4. Finalização (merge vs PR)

Preencha `{{FINALIZE_TITLE}}`, `{{FINALIZE_BODY}}` e
`{{FINALIZE_AVOID_LINE}}` no `orchestrator.md.tpl`, e `{{FINALIZE_STEPS}}`
no `finalizar.md.tpl`, conforme a resposta da pergunta 13 — merge direto
(`git checkout {{DEV_BRANCH}}` → `pull` → `merge --no-ff` → `push` →
apagar branch) ou PR (`git push -u origin feature/<slug>` → `gh pr create
--base {{RELEASE_BRANCH ou DEV_BRANCH conforme o fluxo}}` → parar, sem
merge automático).

## 5. Hooks e settings.json (NÃO sobrescrever, fazer merge se já existir)

Se a resposta 11 (Plan Mode) ou 12 (hooks) for sim, monte um único objeto
e escreva em `.claude/settings.json`:

```json
{
  "defaultMode": "plan",
  "hooks": {
    "PreToolUse": [{ "matcher": "Bash", "hooks": [{ "type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/guard-git-safety.sh" }] }],
    "PostToolUse": [{ "matcher": "Write|Edit", "hooks": [{ "type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/guard-migration-rollback.sh" }] }]
  }
}
```

- `defaultMode` só entra se a resposta 11 foi sim.
- O bloco `hooks` só entra se a resposta 12 foi sim.
- `PostToolUse`/`guard-migration-rollback.sh` só entra se detectou
  `db-migrator` no passo 2.
- Copie os scripts de `.claude/hooks/guard-*.sh.tpl` (substituindo
  placeholders) e torne executáveis (`chmod +x`).
- **Se `.claude/settings.json` já existir**, leia o conteúdo atual e
  faça merge dos campos acima nele (nunca sobrescreva campos que já
  existem lá — avise o usuário se houver conflito, ex: `defaultMode` já
  definido como outra coisa).

## 6. Skills complementares

Pergunte por último quais instalar, seguindo a mesma lógica de stack:
- `grill-me` (mattpocock/skills) e `terms` (Code-Shock/claude-skills) —
  sempre oferecidas
- `e2e-setup` e `code-quality` (ambas Code-Shock/claude-skills) — só se
  detectou frontend no passo 2

Para cada uma escolhida, rode: `npx --yes skills add <repo> --skill
<skill>`. Se falhar (rede/npm), avise e mostre o comando manual — não
trave o resto do fluxo por isso.

## 7. Automação de versionamento

Se a resposta 10 foi sim, gere `.claude/commands/versao.md.tpl` e
`.github/workflows/auto-tag.yml.tpl`, preenchendo `{{RELEASE_BRANCH}}` e
`{{DEV_BRANCH}}`.

## 8. Resto dos arquivos

Gere também (sempre, respeitando a pergunta 14 pra rules/commands/docs):
`docs/architecture/README.md.tpl`, `visao-geral.md.tpl`,
`decisions.md.tpl`, `specs/README.md.tpl`, `.claude/rules/stack.md.tpl`,
`convencoes.md.tpl`, `registro-decisoes.md.tpl`,
`.claude/commands/nova-implementacao.md.tpl`, `finalizar.md.tpl`,
`registrar-decisao.md.tpl`, `diagrama.md.tpl`, `onboarding.md.tpl`, e
`CLAUDE.md` raiz — todos vêm de `${CLAUDE_PLUGIN_ROOT}/templates/`, no
mesmo caminho relativo que têm lá dentro (só sem o sufixo `.tpl`).

## 9. Resumo final

Ao terminar, liste o que foi criado e o que foi pulado por já existir —
igual ao log do CLI Node — e diga pra revisar os campos `[definir]`
antes do primeiro commit.
