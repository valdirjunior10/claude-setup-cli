# @connsoft-tech/claude-init

Scaffolder de estrutura Claude Code (CLAUDE.md em camadas, `.claude/rules`,
`.claude/agents`, `.claude/commands`, `docs/architecture`, `specs/`) pra
qualquer stack — não depende de Node no projeto alvo, é só a ferramenta
de geração.

Gera um `orchestrator` (arquiteto de software do projeto) que conduz o
fluxo de spec-driven development (specify → clarify → plan → tasks →
implement → validate), delega pra agentes especializados detectados pela
sua stack, e finaliza com merge ou Pull Request — sua escolha.

## Pré-requisitos

- Node.js 16+ (só pra rodar o CLI — não afeta a stack do seu projeto)
- Git
- [GitHub CLI (`gh`)](https://cli.github.com/) instalado e autenticado —
  **só necessário se você escolher a estratégia de Pull Request** na
  pergunta de finalização

## Uso

Direto do registro do npm, sem clonar nada:

```bash
npx @connsoft-tech/claude-init
```

Ou instalando globalmente uma vez:

```bash
npm i -g @connsoft-tech/claude-init
claude-init
```

### Rodando a partir do código-fonte (desenvolvimento/customização)

```bash
git clone https://github.com/valdirjunior10/claude-setup-cli.git
cd claude-setup-cli
npm install
npm link
```

Depois, dentro de qualquer repositório novo (ou existente):

```bash
cd /caminho/do/seu/projeto
claude-init
```

Sem instalar globalmente:

```bash
npx --package=/caminho/absoluto/para/claude-setup-cli claude-init
```

## Instalar como plugin do Claude Code (sem precisar de Node)

Se você só usa isso dentro de uma sessão do Claude Code e não quer lidar
com Node/npm, este mesmo repositório também é um plugin:

```bash
claude plugin marketplace add valdirjunior10/claude-setup-cli
claude plugin install claude-init@claude-init
```

Dentro de qualquer sessão do Claude Code, rode `/claude-init`. O comando
faz as mesmas perguntas do CLI e gera os mesmos arquivos — lendo os
templates bundlados no próprio plugin (`${CLAUDE_PLUGIN_ROOT}/templates/`)
e escrevendo com as ferramentas de arquivo do Claude, sem precisar
executar `bin/cli.js`. Mantenha os dois em paridade: qualquer mudança de
pergunta/lógica em `bin/cli.js` deve ser refletida em
`commands/claude-init.md`.

## Projeto existente vs projeto novo

Antes de perguntar qualquer coisa, o CLI olha o diretório atual. Se achar
sinais de projeto existente (pasta não vazia, `package.json`,
`composer.json`, `requirements.txt`/`pyproject.toml`, `go.mod`, etc.), ele:

- **pula** as perguntas de nome, linguagem/framework, banco, mensageria e
  deploy — usa o nome da pasta e detecta a stack automaticamente;
- ainda pergunta se é monorepo:
  - **sim** → pede o **caminho do backend** e o **caminho do frontend**
    (podem ser qualquer pasta, não só `apps/<nome>`) e detecta a stack de
    cada um separadamente;
  - **não** → detecta a stack na raiz do projeto.

Se a pasta estiver vazia/sem manifesto reconhecido, trata como projeto
novo e faz todas as perguntas abaixo normalmente.

## Perguntas que o CLI faz

1. **Nome do projeto/produto** — usado nos textos gerados *(pulada em
   projeto existente)*
2. **É um monorepo com múltiplos apps/pacotes?**
3. **Liste os apps/pacotes** (projeto novo) **ou caminho do
   backend/frontend** (projeto existente) — só se respondeu sim acima
4. **Linguagem/framework principal** — texto livre, ex: `Laravel/PHP`
   *(pulada/auto-detectada em projeto existente)*
5. **Banco de dados e padrão de arquitetura** — ex: `PostgreSQL
   multi-tenant` *(pulada/auto-detectada em projeto existente)*
6. **Mensageria/filas**, se houver — pode deixar em branco *(pulada/auto-detectada
   em projeto existente)*
7. **Como é feito o deploy** — ex: `Dokploy/Docker self-hosted` *(pulada
   em projeto existente)*
8. **Branch principal de desenvolvimento** — padrão `develop`
9. **Branch que dispara o deploy em produção** — padrão `main` (onde a
   tag de release é criada)
10. **Adicionar automação de versionamento** (`/versao` + GitHub Action
    de auto-tag)?
11. **Deixar o Claude Code sempre iniciar em Plan Mode neste projeto?** —
   gera `.claude/settings.json` com `defaultMode: "plan"`
12. **Adicionar hooks de segurança?** — bloqueia push forçado, push
    direto na branch de release, e migration sem rollback
13. **Instalar o MCP do Playwright por padrão?** — gera/atualiza
    `.mcp.json` na raiz (merge seguro se o arquivo já existir)
14. **Ao finalizar, o orchestrator deve fazer merge direto ou abrir PR?**
15. **O que mais deseja gerar?** — subagentes, regras, slash commands,
    esqueleto de docs/architecture (todos marcados por padrão)
16. *(se detectar backend com convenção conhecida, ex: Laravel, e for
    monorepo com mais de um app)* — qual pasta é o backend
17. *(mesma condição)* — gerar `CLAUDE.md` por camada
    (models/controllers/services/repositories)?
18. *(ao final)* — quais skills complementares populares instalar
    (a lista muda conforme a stack detectada — ver seção abaixo)

## O que é gerado

```
CLAUDE.md
.mcp.json                           (se MCP do Playwright confirmado; merge seguro)
.claude/settings.json               (se Plan Mode e/ou hooks confirmados)
.claude/hooks/guard-git-safety.sh          (se hooks confirmados)
.claude/hooks/guard-migration-rollback.sh  (se hooks confirmados e detectou db-migrator)
docs/architecture/README.md
docs/architecture/visao-geral.md
docs/architecture/decisions.md
specs/README.md
.claude/rules/stack.md
.claude/rules/convencoes.md
.claude/rules/registro-decisoes.md
.claude/agents/orchestrator.md      (sempre)
.claude/agents/reviewer.md          (sempre)
.claude/agents/<camada>-implementer.md   (conforme stack detectada)
.claude/commands/nova-implementacao.md
.claude/commands/finalizar.md
.claude/commands/registrar-decisao.md
.claude/commands/diagrama.md
.claude/commands/onboarding.md
.claude/commands/versao.md          (se automação de versionamento confirmada)
.github/workflows/auto-tag.yml      (se automação de versionamento confirmada)
apps/<cada-app>/CLAUDE.md            (se monorepo; em projeto existente, no caminho real informado pro backend/frontend em vez de apps/<nome>)
apps/<app-backend>/<pasta-da-camada>/CLAUDE.md   (se confirmado; mesma regra de caminho acima)
```

Campos marcados como `[definir]` devem ser revisados manualmente antes do
primeiro commit — o CLI preenche a estrutura, não decide seus padrões.

## Detecção de stack

O CLI lê as respostas de linguagem/banco/mensageria e gera agentes por
camada automaticamente (`backend-implementer`, `frontend-implementer`,
`db-migrator`, `queue-worker`) com base em palavras-chave. Se nada bater,
gera um `implementer` genérico. A lista de palavras-chave e as
convenções de pasta conhecidas (hoje só Laravel) ficam em
`STACK_DETECTORS` e `FRAMEWORK_LAYER_PATHS`, no `bin/cli.js`.

## Fluxo de release (scripts prontos)

Em vez de rodar `git add` / `commit` / `npm version` / `git push` na mão
toda vez, use um dos scripts na raiz do repositório:

```bash
# Linux/Mac
./release.sh patch "feat: adiciona nova skill ao catálogo"

# Windows
release.bat patch "feat: adiciona nova skill ao catálogo"
```

Os dois fazem a mesma coisa: commitam o que estiver pendente (se houver),
sobem a versão (`patch`/`minor`/`major`, padrão `patch`), e enviam
commit + tag pro GitHub — o que dispara `.github/workflows/npm-publish.yml`
sozinho, sem precisar de token nem publicar na mão.

## Publicando no npm (uma vez, e a cada atualização)

1. Ter conta no [npmjs.com](https://www.npmjs.com/signup) e criar o
   escopo/organização `connsoft` lá (gratuito para pacotes públicos) —
   ou trocar `@connsoft` por seu usuário pessoal no `name` do
   `package.json` se preferir não criar org.
2. `npm login` no terminal (pede 2FA se estiver ativado na conta).
3. Dentro da pasta do projeto: `npm publish` — o campo
   `publishConfig.access: "public"` já no `package.json` evita precisar
   lembrar do `--access public` toda vez (pacotes com escopo `@algo/`
   são privados por padrão).
4. Pronto — `npx @connsoft-tech/claude-init` já funciona pra qualquer pessoa,
   de qualquer máquina com Node, sem clonar nada.

Pra publicar uma atualização depois: suba a versão em `version` no
`package.json` (`npm version patch` faz isso e já cria o commit/tag de
git) e rode `npm publish` de novo — o npm nunca deixa republicar a
mesma versão, então esse passo é obrigatório mesmo pra uma mudança
pequena.

## Skills complementares

Ao final, o CLI oferece instalar skills populares de terceiros — mas só
as que fazem sentido pra stack detectada **naquele projeto específico**
(cada projeto/dev pode usar uma stack diferente, então a lista muda).

Hoje o catálogo é:
- `grill-me` (sempre oferecida) — interroga uma pergunta por vez antes de
  travar um plano/design; o `orchestrator` já usa no passo de clarify
  quando presente.
- `terms` (sempre oferecida) — mantém glossário de domínio e ADRs.
- `e2e-setup`, `code-quality` (só se detectar frontend JS/TS) — Playwright
  e baseline de lint/format.

A instalação sempre usa `--agent claude-code` (nunca pergunta nem
depende de detectar outro agente instalado na máquina, tipo Cursor).

Para adicionar novas skills ao catálogo, edite `SKILL_CATALOG` em
`bin/cli.js`.

## Customizando os templates

Edite os arquivos em `templates/`. Placeholders no formato `{{NOME}}` são
substituídos pelas respostas do prompt e por valores calculados
(`PROJECT_NAME`, `LANGUAGE`, `DATABASE`, `MESSAGING`, `DEPLOY`,
`DEV_BRANCH`, `APPS_LIST`, `APP_NAME`, `AGENTS_LIST`, `LAYERS_SECTION`,
`FINALIZE_TITLE`, `FINALIZE_BODY`, `FINALIZE_AVOID_LINE`,
`FINALIZE_STEPS`, `FINALIZE_DESC_SUFFIX`).

## Licença e contribuição

MIT — veja [LICENSE](./LICENSE). Este repositório não aceita Pull
Requests de terceiros — veja [CONTRIBUTING.md](./CONTRIBUTING.md).
