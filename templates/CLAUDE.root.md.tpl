# {{PROJECT_NAME}} — contexto raiz

Este arquivo é carregado em toda sessão do Claude Code. Mantenha curto —
detalhes longos vão em `docs/architecture/` e são referenciados com `@`.

## Stack
- Linguagem/framework: {{LANGUAGE}}
- Banco de dados: {{DATABASE}}
- Mensageria: {{MESSAGING}}
- Deploy: {{DEPLOY}}

## Estrutura do repositório
{{APPS_LIST}}

Cada app/pacote acima tem seu próprio `CLAUDE.md` com padrões específicos,
carregado automaticamente quando o Claude edita arquivos daquela pasta.

## Referências de arquitetura
- @docs/architecture/visao-geral.md
- @docs/architecture/decisions.md
- @specs/README.md

## Regras globais
- @.claude/rules/stack.md
- @.claude/rules/convencoes.md
- @.claude/rules/registro-decisoes.md

## Fluxo de trabalho
- Nova implementação: usar `/nova-implementacao`, que aciona o agente
  `architect` — ele conduz o fluxo spec-driven (specify → clarify →
  plan → tasks → implement → validate), aciona o `analyst` para analisar
  a demanda e montar o plano de ação, e delega para os agentes
  especializados corretos.
- Specs de features ficam em `specs/<slug>/` (requirements.md, design.md,
  tasks.md) — ver @specs/README.md.

{{LAYERS_SECTION}}
## Comandos úteis
- build: [definir]
- test: [definir]
- lint: [definir]
- migrate: [definir]
