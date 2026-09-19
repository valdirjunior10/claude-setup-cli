#!/usr/bin/env node
"use strict";

/**
 * claude-init
 * Cria a estrutura .claude/ + CLAUDE.md em camadas + docs/architecture
 * dentro do repositório atual, para QUALQUER stack (não depende de Node
 * no projeto alvo — este CLI só usa Node para gerar os arquivos).
 */

const path = require("path");
const fs = require("fs-extra");
const prompts = require("prompts");
const { execSync } = require("child_process");

const CWD = process.cwd();
const TEMPLATES_DIR = path.join(__dirname, "..", "templates");

function fillPlaceholders(content, data) {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (data[key] === undefined) return "";
    return data[key];
  });
}

// Palavras-chave usadas para detectar quais agentes de camada faz sentido
// gerar, a partir das respostas livres de stack. Genérico — não assume
// nenhuma stack fixa.
const STACK_DETECTORS = [
  {
    template: ".claude/agents/backend-implementer.md.tpl",
    target: "backend-implementer.md",
    field: "language",
    desc: "implementação de lógica de backend e API",
    keywords: [
      "laravel", "php", "nestjs", "node", "express", "django", "flask",
      "python", "rails", "ruby", ".net", "dotnet", "c#", "spring",
      "java", "golang", "fastapi", "symfony",
    ],
  },
  {
    template: ".claude/agents/frontend-implementer.md.tpl",
    target: "frontend-implementer.md",
    field: "language",
    desc: "implementação de UI e integração com API",
    keywords: [
      "react", "vue", "angular", "svelte", "next.js", "nextjs", "nuxt",
    ],
  },
  {
    template: ".claude/agents/db-migrator.md.tpl",
    target: "db-migrator.md",
    field: "database",
    desc: "migrations e mudanças de schema no banco",
    keywords: [
      "postgres", "postgresql", "mysql", "mongodb", "mongo", "sqlite",
      "sql server", "mariadb", "oracle",
    ],
  },
  {
    template: ".claude/agents/queue-worker.md.tpl",
    target: "queue-worker.md",
    field: "messaging",
    desc: "publishers/consumers de fila e contratos de eventos",
    keywords: ["rabbitmq", "kafka", "sqs", "redis", "nats", "activemq"],
  },
];

function detectAgents(answers) {
  const combinedText = [answers.language, answers.database, answers.messaging]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const matched = [];
  for (const detector of STACK_DETECTORS) {
    if (detector.keywords.some((kw) => combinedText.includes(kw))) {
      matched.push(detector);
    }
  }
  return matched;
}

// Nome de exibição do framework de backend detectado, por palavra-chave.
const BACKEND_FRAMEWORK_NAMES = {
  laravel: "Laravel",
  php: "PHP",
  nestjs: "NestJS",
  node: "Node",
  express: "Express",
  django: "Django",
  flask: "Flask",
  python: "Python",
  rails: "Rails",
  ruby: "Ruby",
  ".net": ".NET",
  "c#": ".NET",
  spring: "Spring",
  java: "Java",
  golang: "Go",
  fastapi: "FastAPI",
  symfony: "Symfony",
};

function detectBackendFramework(combinedText) {
  for (const [kw, name] of Object.entries(BACKEND_FRAMEWORK_NAMES)) {
    if (combinedText.includes(kw)) return name;
  }
  return null;
}

// Convenções de pastas conhecidas por framework — adicione novas conforme
// o time usar outras stacks. Fallback genérico cobre o resto.
const FRAMEWORK_LAYER_PATHS = {
  Laravel: {
    models: "app/Models",
    controllers: "app/Http/Controllers",
    services: "app/Services",
    repositories: "app/Repositories",
  },
};
const GENERIC_LAYER_PATHS = {
  models: "src/models",
  controllers: "src/controllers",
  services: "src/services",
  repositories: "src/repositories",
};

function buildLayersSection(layerPaths) {
  const lines = Object.values(layerPaths).map(
    (relPath) => `- @${relPath}/CLAUDE.md`
  );
  return `## Camadas\n${lines.join("\n")}\n`;
}

// Skills populares de terceiros — só sugeridas quando fazem sentido pra
// stack detectada no projeto (cada projeto/dev pode ter uma diferente).
const SKILL_CATALOG = [
  {
    id: "grill-me",
    repo: "mattpocock/skills",
    skill: "grill-me",
    desc: "interroga você uma pergunta por vez antes de travar um plano/design",
    universal: true,
  },
  {
    id: "terms",
    repo: "Code-Shock/claude-skills",
    skill: "terms",
    desc: "mantém glossário de domínio (CONTEXT.md) e ADRs",
    universal: true,
  },
  {
    id: "e2e-setup",
    repo: "Code-Shock/claude-skills",
    skill: "e2e-setup",
    desc: "scaffold de testes E2E com Playwright (stacks JS/TS)",
    requiresFrontend: true,
  },
  {
    id: "code-quality",
    repo: "Code-Shock/claude-skills",
    skill: "code-quality",
    desc: "baseline Prettier/ESLint/husky/CI gate (stacks JS/TS)",
    requiresFrontend: true,
  },
];

function getApplicableSkills(detectedAgents) {
  const hasFrontend = detectedAgents.some(
    (a) => a.target === "frontend-implementer.md"
  );
  return SKILL_CATALOG.filter(
    (s) => s.universal || (s.requiresFrontend && hasFrontend)
  );
}

// Texto do passo final (commit + merge OU commit + PR), conforme escolha
// do dev. Usado tanto no architect quanto no /finalizar.
function buildFinalizeBlock(mergeStrategy, devBranch) {
  if (mergeStrategy === "pr") {
    return {
      title: "commit e abrir Pull Request",
      body:
        `com o \`reviewer\` aprovado: marcar as subtarefas concluídas em ` +
        `\`tasks.md\`, commit na branch \`feature/<slug>\` com mensagem clara, ` +
        `\`git push -u origin feature/<slug>\`, e abrir Pull Request pra ` +
        `\`${devBranch}\` via \`gh pr create --base ${devBranch} --title "<título>" ` +
        `--body "<resumo de requirements.md e tasks.md>"\`. **Não fazer merge ` +
        `sozinho** — aguardar aprovação humana do PR antes de entrar em ${devBranch}.`,
      avoidLine: `Não faça merge de um PR sozinho — isso é decisão humana; sua responsabilidade termina em abrir o PR com o \`reviewer\` aprovado.`,
      finalizarSteps:
        `5. Commit na branch atual com mensagem clara resumindo as mudanças.\n` +
        `6. \`git push -u origin feature/<slug>\`.\n` +
        `7. Abrir Pull Request pra \`${devBranch}\`: \`gh pr create --base ${devBranch} ` +
        `--title "<título>" --body "<resumo>"\`. Não fazer merge sozinho.`,
    };
  }
  return {
    title: "commit e merge",
    body:
      `com o \`reviewer\` aprovado: marcar as subtarefas concluídas em ` +
      `\`tasks.md\`, fazer o commit na branch \`feature/<slug>\` com mensagem ` +
      `clara, depois \`git checkout ${devBranch}\`, \`git pull\`, ` +
      `\`git merge --no-ff feature/<slug>\`, \`git push\`. Deletar a branch ` +
      `\`feature/<slug>\` local após o merge (\`git branch -d\`).`,
    avoidLine: `Não faça merge em ${devBranch} sem o \`reviewer\` ter passado.`,
    finalizarSteps:
      `5. Commit na branch atual com mensagem clara resumindo as mudanças.\n` +
      `6. \`git checkout ${devBranch}\`, \`git pull\`, \`git merge --no-ff ` +
      `feature/<slug>\`, \`git push\`.\n` +
      `7. Deletar a branch \`feature/<slug>\` local (\`git branch -d\`).`,
  };
}

async function writeFromTemplate(templateRelPath, targetAbsPath, data) {
  const templatePath = path.join(TEMPLATES_DIR, templateRelPath);
  const raw = await fs.readFile(templatePath, "utf8");
  const filled = fillPlaceholders(raw, data);
  await fs.ensureDir(path.dirname(targetAbsPath));

  const exists = await fs.pathExists(targetAbsPath);
  if (exists) {
    console.log(`  já existe, pulando: ${path.relative(CWD, targetAbsPath)}`);
    return;
  }
  await fs.writeFile(targetAbsPath, filled, "utf8");
  console.log(`  criado: ${path.relative(CWD, targetAbsPath)}`);
}

// Detecta sinais de projeto NOVO vs EXISTENTE no diretório atual, pra
// usar como sugestão nas perguntas — nunca decide sozinho, só pré-preenche.
async function detectProjectContext(cwd) {
  const ctx = {
    isExisting: false,
    signals: [],
    suggestedLanguage: null,
    suggestedDatabase: null,
    suggestedMessaging: null,
    suggestedMonorepo: null,
    suggestedApps: [],
    suggestedDevBranch: null,
    existingClaudeFiles: [],
  };

  const entries = await fs.readdir(cwd).catch(() => []);
  const meaningful = entries.filter((e) => !["/.git", ".git", "node_modules"].includes(e));
  if (meaningful.length > 0) {
    ctx.isExisting = true;
  }

  // git: branch atual como sugestão de devBranch
  try {
    const branch = execSync("git branch --show-current", { cwd, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
    if (branch) {
      ctx.suggestedDevBranch = branch;
      ctx.signals.push(`branch git atual: ${branch}`);
    }
  } catch (_) {
    /* não é um repo git ainda, ou git indisponível — segue sem sugestão */
  }

  // package.json — Node/JS: tenta adivinhar frontend/backend pelas deps
  const pkgPath = path.join(cwd, "package.json");
  if (await fs.pathExists(pkgPath)) {
    ctx.isExisting = true;
    try {
      const pkg = JSON.parse(await fs.readFile(pkgPath, "utf8"));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      const found = [];
      if (deps.react) found.push("React");
      if (deps.vue) found.push("Vue");
      if (deps["@angular/core"]) found.push("Angular");
      if (deps.next) found.push("Next.js");
      if (deps.express) found.push("Express");
      if (deps["@nestjs/core"]) found.push("NestJS");
      if (found.length) {
        ctx.suggestedLanguage = found.join(" e ");
        ctx.signals.push(`package.json com ${found.join(", ")}`);
      } else {
        ctx.signals.push("package.json (Node) encontrado, sem framework reconhecido nas deps");
      }
    } catch (_) {
      /* package.json inválido — ignora */
    }
  }

  // composer.json — PHP/Laravel
  const composerPath = path.join(cwd, "composer.json");
  if (await fs.pathExists(composerPath)) {
    ctx.isExisting = true;
    try {
      const composer = JSON.parse(await fs.readFile(composerPath, "utf8"));
      const require_ = { ...composer.require, ...composer["require-dev"] };
      if (require_["laravel/framework"]) {
        ctx.suggestedLanguage = ctx.suggestedLanguage
          ? `${ctx.suggestedLanguage} e Laravel/PHP`
          : "Laravel/PHP";
        ctx.signals.push("composer.json com laravel/framework");
      } else {
        ctx.signals.push("composer.json (PHP) encontrado, sem Laravel reconhecido");
      }
    } catch (_) {
      /* composer.json inválido — ignora */
    }
  }

  // requirements.txt / pyproject.toml — Python
  if (
    (await fs.pathExists(path.join(cwd, "requirements.txt"))) ||
    (await fs.pathExists(path.join(cwd, "pyproject.toml")))
  ) {
    ctx.isExisting = true;
    ctx.suggestedLanguage = ctx.suggestedLanguage ? `${ctx.suggestedLanguage} e Python` : "Python";
    ctx.signals.push("manifesto Python encontrado (requirements.txt/pyproject.toml)");
  }

  // go.mod — Go
  if (await fs.pathExists(path.join(cwd, "go.mod"))) {
    ctx.isExisting = true;
    ctx.suggestedLanguage = ctx.suggestedLanguage ? `${ctx.suggestedLanguage} e Go` : "Go";
    ctx.signals.push("go.mod encontrado");
  }

  // docker-compose.yml — tenta achar Postgres/MySQL/RabbitMQ nos serviços
  const composePath = path.join(cwd, "docker-compose.yml");
  if (await fs.pathExists(composePath)) {
    try {
      const compose = (await fs.readFile(composePath, "utf8")).toLowerCase();
      const dbFound = [];
      if (compose.includes("postgres")) dbFound.push("PostgreSQL");
      if (compose.includes("mysql") || compose.includes("mariadb")) dbFound.push("MySQL");
      if (compose.includes("mongo")) dbFound.push("MongoDB");
      if (dbFound.length) {
        ctx.suggestedDatabase = dbFound.join(" e ");
        ctx.signals.push(`docker-compose.yml com ${dbFound.join(", ")}`);
      }
      const msgFound = [];
      if (compose.includes("rabbitmq")) msgFound.push("RabbitMQ");
      if (compose.includes("kafka")) msgFound.push("Kafka");
      if (compose.includes("redis")) msgFound.push("Redis");
      if (compose.includes("nats")) msgFound.push("NATS");
      if (compose.includes("activemq")) msgFound.push("ActiveMQ");
      if (msgFound.length) {
        ctx.suggestedMessaging = msgFound.join(" e ");
        ctx.signals.push(`docker-compose.yml com ${msgFound.join(", ")}`);
      }
    } catch (_) {
      /* docker-compose.yml ilegível — ignora */
    }
  }

  // apps/ ou packages/ — sinal de monorepo, com nomes reais das pastas
  for (const dirName of ["apps", "packages"]) {
    const dirPath = path.join(cwd, dirName);
    if (await fs.pathExists(dirPath)) {
      const sub = await fs.readdir(dirPath).catch(() => []);
      const realDirs = [];
      for (const s of sub) {
        const stat = await fs.stat(path.join(dirPath, s)).catch(() => null);
        if (stat && stat.isDirectory()) realDirs.push(s);
      }
      if (realDirs.length) {
        ctx.suggestedMonorepo = true;
        ctx.suggestedApps = realDirs;
        ctx.signals.push(`pasta ${dirName}/ com: ${realDirs.join(", ")}`);
      }
    }
  }

  // .claude/ já existente — lista o que já tem, pra avisar antes de rodar
  const claudeDir = path.join(cwd, ".claude");
  if (await fs.pathExists(claudeDir)) {
    for (const sub of ["agents", "commands", "rules", "hooks"]) {
      const subDir = path.join(claudeDir, sub);
      if (await fs.pathExists(subDir)) {
        const files = await fs.readdir(subDir).catch(() => []);
        if (files.length) ctx.existingClaudeFiles.push(`.claude/${sub}/ (${files.length} arquivo(s))`);
      }
    }
    if (await fs.pathExists(path.join(claudeDir, "settings.json"))) {
      ctx.existingClaudeFiles.push(".claude/settings.json");
    }
  }
  if (await fs.pathExists(path.join(cwd, "CLAUDE.md"))) {
    ctx.existingClaudeFiles.push("CLAUDE.md");
  }

  return ctx;
}

// Tenta achar uma pasta existente entre nomes comuns (backend/frontend),
// só pra sugerir um default nas perguntas — usuário confirma ou corrige.
async function guessDir(cwd, candidates) {
  for (const c of candidates) {
    if (await fs.pathExists(path.join(cwd, c))) return c;
  }
  return "";
}

const BACKEND_DIR_CANDIDATES = ["backend", "api", "server"];
const FRONTEND_DIR_CANDIDATES = ["frontend", "web", "client", "app"];

async function main() {
  console.log("\n=== claude-init — setup de ambiente Claude Code ===\n");

  const projectCtx = await detectProjectContext(CWD);

  if (projectCtx.isExisting) {
    console.log("Projeto existente detectado:");
    if (projectCtx.signals.length) {
      for (const s of projectCtx.signals) console.log(`  - ${s}`);
    } else {
      console.log("  - pasta não vazia, sem manifesto de stack reconhecido");
    }
    if (projectCtx.existingClaudeFiles.length) {
      console.log("\nJá existe configuração Claude Code neste projeto:");
      for (const f of projectCtx.existingClaudeFiles) console.log(`  - ${f}`);
      console.log("  (nada será sobrescrito — arquivos existentes são pulados)");
    }
    console.log("\nUsando o que foi detectado como sugestão nas perguntas abaixo — corrija se estiver errado.\n");
  } else {
    console.log("Nenhum sinal de projeto existente — tratando como projeto novo.\n");
  }

  // Projeto existente: nome/stacks/pacotes/deploy são detectados
  // automaticamente (ou perguntados via monorepo abaixo) em vez de
  // perguntados — só o essencial é perguntado de novo.
  const skipForExisting = projectCtx.isExisting;

  const answers = await prompts(
    [
      {
        type: skipForExisting ? null : "text",
        name: "projectName",
        message: "Nome do projeto/produto",
        initial: path.basename(CWD),
      },
      {
        type: "confirm",
        name: "isMonorepo",
        message: "É um monorepo com múltiplos apps/pacotes?",
        initial: projectCtx.suggestedMonorepo !== null ? projectCtx.suggestedMonorepo : false,
      },
      {
        type: (prev) => (prev && !skipForExisting ? "list" : null),
        name: "apps",
        message:
          "Liste os apps/pacotes separados por vírgula (ex: api, web, worker)",
        separator: ",",
        initial: projectCtx.suggestedApps.length ? projectCtx.suggestedApps.join(", ") : "",
      },
      {
        type: skipForExisting ? null : "text",
        name: "language",
        message: "Linguagem/framework principal (ex: Laravel/PHP, Go, .NET)",
        initial: projectCtx.suggestedLanguage || "",
      },
      {
        type: skipForExisting ? null : "text",
        name: "database",
        message: "Banco de dados e padrão de arquitetura (ex: PostgreSQL multi-tenant)",
        initial: projectCtx.suggestedDatabase || "",
      },
      {
        type: skipForExisting ? null : "text",
        name: "messaging",
        message: "Mensageria/filas, se houver (ex: RabbitMQ) — deixe em branco se não usar",
      },
      {
        type: skipForExisting ? null : "text",
        name: "deploy",
        message: "Como é feito o deploy (ex: Dokploy/Docker self-hosted)",
      },
      {
        type: "text",
        name: "devBranch",
        message: "Qual é a branch principal de desenvolvimento (origem e destino do merge das features)?",
        initial: projectCtx.suggestedDevBranch || "develop",
      },
      {
        type: "text",
        name: "releaseBranch",
        message: "Qual branch dispara o deploy em produção (onde a tag de release deve ser criada)?",
        initial: "main",
      },
      {
        type: "confirm",
        name: "addVersioning",
        message: "Adicionar automação de versionamento (/versao + GitHub Action de auto-tag na branch de release)?",
        initial: true,
      },
      {
        type: "confirm",
        name: "planModeDefault",
        message: "Deixar o Claude Code sempre iniciar em Plan Mode neste projeto (defaultMode: \"plan\" em .claude/settings.json)?",
        initial: true,
      },
      {
        type: "confirm",
        name: "addHooks",
        message: "Adicionar hooks de segurança (bloqueia push forçado, bloqueia push direto na branch de release, bloqueia migration sem rollback)?",
        initial: true,
      },
      {
        type: "confirm",
        name: "addPlaywrightMcp",
        message: "Instalar o MCP do Playwright por padrão neste projeto (.mcp.json — automação de browser pra QA/testes)?",
        initial: true,
      },
      {
        type: "select",
        name: "mergeStrategy",
        message: "Ao finalizar uma implementação aprovada pelo reviewer, o architect deve:",
        choices: [
          {
            title: "Fazer merge direto na branch de desenvolvimento (sem revisão humana)",
            value: "merge",
          },
          {
            title: "Abrir Pull Request e parar (revisão humana antes de entrar na branch de desenvolvimento)",
            value: "pr",
          },
        ],
      },
      {
        type: "multiselect",
        name: "extras",
        message: "O que mais deseja gerar?",
        choices: [
          { title: "Subagentes de domínio (.claude/agents)", value: "agents", selected: true },
          { title: "Regras atômicas (.claude/rules)", value: "rules", selected: true },
          { title: "Slash commands base (.claude/commands)", value: "commands", selected: true },
          { title: "Esqueleto de docs/architecture", value: "docs", selected: true },
        ],
      },
    ],
    {
      onCancel: () => {
        console.log("\nCancelado.");
        process.exit(1);
      },
    }
  );

  // Caminho relativo (a partir de CWD) de cada app — por padrão "apps/<nome>"
  // (convenção histórica do gerador), mas pra monorepo de projeto existente
  // usamos o caminho real informado pelo usuário (backend/frontend podem
  // estar em qualquer lugar, não só dentro de apps/).
  const appRelPaths = {};
  let presetBackendAppFolder = null;

  if (skipForExisting) {
    answers.projectName = path.basename(CWD);
    answers.deploy = "";

    if (answers.isMonorepo) {
      const backendGuess =
        (await guessDir(CWD, BACKEND_DIR_CANDIDATES)) ||
        projectCtx.suggestedApps.find((a) => /back|api|server/i.test(a)) ||
        "";
      const frontendGuess =
        (await guessDir(CWD, FRONTEND_DIR_CANDIDATES)) ||
        projectCtx.suggestedApps.find((a) => /front|web|client|app/i.test(a)) ||
        "";

      const pathAnswers = await prompts(
        [
          {
            type: "text",
            name: "backendPath",
            message: "Caminho da pasta do backend (relativo à raiz do projeto)",
            initial: backendGuess,
          },
          {
            type: "text",
            name: "frontendPath",
            message: "Caminho da pasta do frontend (relativo à raiz do projeto)",
            initial: frontendGuess,
          },
        ],
        {
          onCancel: () => {
            console.log("\nCancelado.");
            process.exit(1);
          },
        }
      );

      const backendRel = pathAnswers.backendPath.trim();
      const frontendRel = pathAnswers.frontendPath.trim();
      const backendName = path.basename(backendRel) || "backend";
      const frontendName = path.basename(frontendRel) || "frontend";

      const backendCtx = backendRel
        ? await detectProjectContext(path.join(CWD, backendRel))
        : null;
      const frontendCtx = frontendRel
        ? await detectProjectContext(path.join(CWD, frontendRel))
        : null;

      if (backendCtx) {
        appRelPaths[backendName] = backendRel;
        console.log(`\nStack detectada em ${backendRel}:`);
        for (const s of backendCtx.signals) console.log(`  - ${s}`);
      }
      if (frontendCtx) {
        appRelPaths[frontendName] = frontendRel;
        console.log(`\nStack detectada em ${frontendRel}:`);
        for (const s of frontendCtx.signals) console.log(`  - ${s}`);
      }

      answers.apps = [
        backendRel ? backendName : null,
        frontendRel ? frontendName : null,
      ].filter(Boolean);
      answers.language = [
        backendCtx && backendCtx.suggestedLanguage,
        frontendCtx && frontendCtx.suggestedLanguage,
      ]
        .filter(Boolean)
        .join(" e ");
      answers.database = (backendCtx && backendCtx.suggestedDatabase) || (frontendCtx && frontendCtx.suggestedDatabase) || "";
      answers.messaging = (backendCtx && backendCtx.suggestedMessaging) || (frontendCtx && frontendCtx.suggestedMessaging) || "";
      presetBackendAppFolder = backendRel ? backendName : null;
    } else {
      answers.apps = [];
      answers.language = projectCtx.suggestedLanguage || "";
      answers.database = projectCtx.suggestedDatabase || "";
      answers.messaging = projectCtx.suggestedMessaging || "";
    }
  }

  const apps =
    answers.apps && answers.apps.length
      ? answers.apps.map((a) => a.trim()).filter(Boolean)
      : [];

  const combinedText = [answers.language, answers.database, answers.messaging]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const backendFramework = detectBackendFramework(combinedText);

  // backendAppFolder === null significa "raiz do repo" (projeto não é
  // monorepo, ou é monorepo mas só tem um app informado como app único).
  let backendAppFolder = presetBackendAppFolder;
  let generateLayers = false;
  let layerPaths = null;
  let layersSectionText = "";

  if (backendFramework && answers.extras.includes("agents")) {
    if (!backendAppFolder && answers.isMonorepo && apps.length > 1) {
      const sel = await prompts(
        {
          type: "select",
          name: "backendApp",
          message: `Qual pasta é o backend (${backendFramework})?`,
          choices: apps.map((a) => ({ title: a, value: a })),
        },
        {
          onCancel: () => {
            console.log("\nCancelado.");
            process.exit(1);
          },
        }
      );
      backendAppFolder = sel.backendApp;
    } else if (apps.length === 1) {
      backendAppFolder = apps[0];
    }

    const knownConvention = Boolean(FRAMEWORK_LAYER_PATHS[backendFramework]);
    const confirmAnswer = await prompts(
      {
        type: "confirm",
        name: "generateLayers",
        message:
          `Gerar CLAUDE.md por camada (models, controllers, services, repositories)` +
          (knownConvention
            ? ` seguindo o padrão de pastas do ${backendFramework}?`
            : ` em pastas genéricas (${backendFramework} ainda não tem convenção mapeada — você pode ajustar os caminhos depois)?`),
        initial: true,
      },
      {
        onCancel: () => {
          console.log("\nCancelado.");
          process.exit(1);
        },
      }
    );
    generateLayers = confirmAnswer.generateLayers;

    if (generateLayers) {
      layerPaths = FRAMEWORK_LAYER_PATHS[backendFramework] || GENERIC_LAYER_PATHS;
      layersSectionText = buildLayersSection(layerPaths);
    }
  }

  const data = {
    PROJECT_NAME: answers.projectName,
    LANGUAGE: answers.language || "[definir]",
    DATABASE: answers.database || "[definir]",
    MESSAGING: answers.messaging || "[não utilizado]",
    DEPLOY: answers.deploy || "[definir]",
    DEV_BRANCH: answers.devBranch || "develop",
    RELEASE_BRANCH: answers.releaseBranch || "main",
    APPS_LIST: apps.map((a) => `- \`${a}\``).join("\n") || "- (definir apps do monorepo)",
    // Só entra no CLAUDE.md raiz se o backend for a própria raiz (sem apps/).
    LAYERS_SECTION: backendAppFolder === null ? layersSectionText : "",
  };

  // Detecção de agentes é usada tanto na geração dos agents (mais abaixo)
  // quanto para decidir se o hook de migration faz sentido aqui.
  let detected = [];

  console.log("\nGerando estrutura...\n");

  // 1. CLAUDE.md raiz
  await writeFromTemplate("CLAUDE.root.md.tpl", path.join(CWD, "CLAUDE.md"), data);

  // 1.1 .mcp.json — Playwright MCP, com merge seguro se o arquivo já existir
  if (answers.addPlaywrightMcp) {
    const mcpPath = path.join(CWD, ".mcp.json");
    let mcpObj = { mcpServers: {} };
    let existed = false;
    if (await fs.pathExists(mcpPath)) {
      existed = true;
      try {
        mcpObj = JSON.parse(await fs.readFile(mcpPath, "utf8"));
        if (!mcpObj.mcpServers) mcpObj.mcpServers = {};
      } catch (_) {
        console.log("  .mcp.json existente não é JSON válido — pulando (corrija manualmente).");
        mcpObj = null;
      }
    }
    if (mcpObj) {
      if (mcpObj.mcpServers.playwright) {
        console.log("  .mcp.json já tem 'playwright' configurado — pulando.");
      } else {
        mcpObj.mcpServers.playwright = {
          command: "npx",
          args: ["@playwright/mcp@latest"],
        };
        await fs.ensureDir(path.dirname(mcpPath));
        await fs.writeFile(mcpPath, JSON.stringify(mcpObj, null, 2) + "\n", "utf8");
        console.log(`  ${existed ? "atualizado" : "criado"}: .mcp.json`);
      }
    }
  }

  // 1.5 CLAUDE.md por camada do backend (models/controllers/services/repositories)
  if (generateLayers && layerPaths) {
    const baseDir = backendAppFolder
      ? path.join(CWD, appRelPaths[backendAppFolder] || path.join("apps", backendAppFolder))
      : CWD;
    for (const [layerKey, relPath] of Object.entries(layerPaths)) {
      await writeFromTemplate(
        ".claude/layer/CLAUDE.layer.md.tpl",
        path.join(baseDir, relPath, "CLAUDE.md"),
        { ...data, LAYER_NAME: layerKey, LAYER_PATH: relPath, FRAMEWORK: backendFramework }
      );
    }
  }

  // 2. docs/architecture
  if (answers.extras.includes("docs")) {
    await writeFromTemplate(
      "docs/architecture/README.md.tpl",
      path.join(CWD, "docs", "architecture", "README.md"),
      data
    );
    await writeFromTemplate(
      "docs/architecture/visao-geral.md.tpl",
      path.join(CWD, "docs", "architecture", "visao-geral.md"),
      data
    );
    await writeFromTemplate(
      "docs/architecture/decisions.md.tpl",
      path.join(CWD, "docs", "architecture", "decisions.md"),
      data
    );
    await writeFromTemplate(
      "specs/README.md.tpl",
      path.join(CWD, "specs", "README.md"),
      data
    );
  }

  // 3. rules
  if (answers.extras.includes("rules")) {
    await writeFromTemplate(
      ".claude/rules/stack.md.tpl",
      path.join(CWD, ".claude", "rules", "stack.md"),
      data
    );
    await writeFromTemplate(
      ".claude/rules/convencoes.md.tpl",
      path.join(CWD, ".claude", "rules", "convencoes.md"),
      data
    );
    await writeFromTemplate(
      ".claude/rules/registro-decisoes.md.tpl",
      path.join(CWD, ".claude", "rules", "registro-decisoes.md"),
      data
    );
  }

  // 4. agents — detecta camadas pela stack informada; se nada bater,
  // cai no genérico "implementer".
  if (answers.extras.includes("agents")) {
    detected = detectAgents(answers);
    const agentListEntries = [];

    if (detected.length === 0) {
      await writeFromTemplate(
        ".claude/agents/implementer.md.tpl",
        path.join(CWD, ".claude", "agents", "implementer.md"),
        data
      );
      agentListEntries.push({ name: "implementer", desc: "implementação genérica" });
      console.log("  (nenhuma stack reconhecida — gerado agente genérico 'implementer')");
    } else {
      for (const agent of detected) {
        await writeFromTemplate(agent.template, path.join(CWD, ".claude", "agents", agent.target), data);
        agentListEntries.push({ name: agent.target.replace(".md", ""), desc: agent.desc });
      }
    }

    // reviewer sempre é gerado — revisa contra todas as camadas
    await writeFromTemplate(
      ".claude/agents/reviewer.md.tpl",
      path.join(CWD, ".claude", "agents", "reviewer.md"),
      data
    );
    agentListEntries.push({
      name: "reviewer",
      desc: "revisão de código e conformidade com os padrões, antes de finalizar qualquer tarefa",
    });

    const formatAgentsList = (entries) =>
      entries.map((e) => `- \`${e.name}\` — ${e.desc}`).join("\n");

    // analista de sistemas — sempre gerado; analisa a demanda e monta o plano
    // de ação, mapeando subtarefas só para os agentes acima
    await writeFromTemplate(
      ".claude/agents/analyst.md.tpl",
      path.join(CWD, ".claude", "agents", "analyst.md"),
      { ...data, AGENTS_LIST: formatAgentsList(agentListEntries) }
    );
    agentListEntries.unshift({
      name: "analyst",
      desc: "análise da demanda (requirements.md) e plano de ação (tasks.md)",
    });

    // arquiteto — sempre gerado, com a lista de agentes acima já preenchida
    const finalizeBlock = buildFinalizeBlock(answers.mergeStrategy, data.DEV_BRANCH);
    await writeFromTemplate(
      ".claude/agents/architect.md.tpl",
      path.join(CWD, ".claude", "agents", "architect.md"),
      {
        ...data,
        AGENTS_LIST: formatAgentsList(agentListEntries),
        FINALIZE_TITLE: finalizeBlock.title,
        FINALIZE_BODY: finalizeBlock.body,
        FINALIZE_AVOID_LINE: finalizeBlock.avoidLine,
      }
    );
  }

  // 4.5 settings.json — Plan Mode e/ou hooks, combinados no MESMO arquivo
  // (writeFromTemplate não faz merge, então construímos o objeto aqui).
  if (answers.planModeDefault || answers.addHooks) {
    const settingsObj = {};
    if (answers.planModeDefault) {
      settingsObj.defaultMode = "plan";
    }
    if (answers.addHooks) {
      await writeFromTemplate(
        ".claude/hooks/guard-git-safety.sh.tpl",
        path.join(CWD, ".claude", "hooks", "guard-git-safety.sh"),
        data
      );
      await fs.chmod(path.join(CWD, ".claude", "hooks", "guard-git-safety.sh"), 0o755);

      settingsObj.hooks = {
        PreToolUse: [
          {
            matcher: "Bash",
            hooks: [
              {
                type: "command",
                command: "$CLAUDE_PROJECT_DIR/.claude/hooks/guard-git-safety.sh",
              },
            ],
          },
        ],
      };

      // hook de migration só faz sentido se detectamos um agente de banco
      const hasDbMigrator = detected.some((a) => a.target === "db-migrator.md");
      if (hasDbMigrator) {
        await writeFromTemplate(
          ".claude/hooks/guard-migration-rollback.sh.tpl",
          path.join(CWD, ".claude", "hooks", "guard-migration-rollback.sh"),
          data
        );
        await fs.chmod(
          path.join(CWD, ".claude", "hooks", "guard-migration-rollback.sh"),
          0o755
        );
        settingsObj.hooks.PostToolUse = [
          {
            matcher: "Write|Edit",
            hooks: [
              {
                type: "command",
                command: "$CLAUDE_PROJECT_DIR/.claude/hooks/guard-migration-rollback.sh",
              },
            ],
          },
        ];
      }
    }

    const settingsPath = path.join(CWD, ".claude", "settings.json");
    if (await fs.pathExists(settingsPath)) {
      console.log(`  já existe, pulando: ${path.relative(CWD, settingsPath)}`);
    } else {
      await fs.ensureDir(path.dirname(settingsPath));
      await fs.writeFile(settingsPath, JSON.stringify(settingsObj, null, 2) + "\n", "utf8");
      console.log(`  criado: ${path.relative(CWD, settingsPath)}`);
    }
  }

  // 5. commands
  if (answers.extras.includes("commands")) {
    await writeFromTemplate(
      ".claude/commands/nova-implementacao.md.tpl",
      path.join(CWD, ".claude", "commands", "nova-implementacao.md"),
      data
    );
    const finalizeBlockCmd = buildFinalizeBlock(answers.mergeStrategy, data.DEV_BRANCH);
    await writeFromTemplate(
      ".claude/commands/finalizar.md.tpl",
      path.join(CWD, ".claude", "commands", "finalizar.md"),
      {
        ...data,
        FINALIZE_STEPS: finalizeBlockCmd.finalizarSteps,
        FINALIZE_DESC_SUFFIX:
          answers.mergeStrategy === "pr"
            ? "abre um Pull Request pra revisão"
            : `faz merge com ${data.DEV_BRANCH} e limpa a branch`,
      }
    );
    await writeFromTemplate(
      ".claude/commands/registrar-decisao.md.tpl",
      path.join(CWD, ".claude", "commands", "registrar-decisao.md"),
      data
    );
    await writeFromTemplate(
      ".claude/commands/diagrama.md.tpl",
      path.join(CWD, ".claude", "commands", "diagrama.md"),
      data
    );
    await writeFromTemplate(
      ".claude/commands/onboarding.md.tpl",
      path.join(CWD, ".claude", "commands", "onboarding.md"),
      data
    );

    // versionamento — /versao + GitHub Action de auto-tag, se confirmado
    if (answers.addVersioning) {
      await writeFromTemplate(
        ".claude/commands/versao.md.tpl",
        path.join(CWD, ".claude", "commands", "versao.md"),
        data
      );
      await writeFromTemplate(
        ".github/workflows/auto-tag.yml.tpl",
        path.join(CWD, ".github", "workflows", "auto-tag.yml"),
        data
      );
    }
  }

  // 6. CLAUDE.md por app (monorepo)
  if (answers.isMonorepo && apps.length) {
    for (const app of apps) {
      await writeFromTemplate(
        "app/CLAUDE.app.md.tpl",
        path.join(CWD, appRelPaths[app] || path.join("apps", app), "CLAUDE.md"),
        {
          ...data,
          APP_NAME: app,
          LAYERS_SECTION: app === backendAppFolder ? layersSectionText : "",
        }
      );
    }
  }

  console.log("\nPronto. Revise os placeholders [definir] antes de commitar.\n");

  // 7. skills complementares — só oferece as que fazem sentido pra stack
  // detectada neste projeto específico.
  if (answers.extras.includes("agents")) {
    const applicableSkills = getApplicableSkills(detected);

    if (applicableSkills.length) {
      const { skillsToInstall } = await prompts(
        {
          type: "multiselect",
          name: "skillsToInstall",
          message: "Instalar skills complementares populares (aplicáveis à stack deste projeto)?",
          choices: applicableSkills.map((s) => ({
            title: `${s.id} — ${s.desc}`,
            value: s.id,
            selected: true,
          })),
        },
        {
          onCancel: () => {
            console.log("\nCancelado.");
            process.exit(1);
          },
        }
      );

      for (const skillId of skillsToInstall || []) {
        const skillDef = applicableSkills.find((s) => s.id === skillId);
        // --agent claude-code fixa o alvo (por padrão é sempre Claude Code
        // aqui, nunca outro agente); -y evita prompt interativo de confirmação.
        const skillsCmd = `npx --yes skills add ${skillDef.repo} --skill ${skillDef.skill} --agent claude-code -y`;
        console.log(`\nInstalando ${skillId} via npx skills...\n`);
        try {
          execSync(skillsCmd, {
            cwd: CWD,
            stdio: "inherit",
          });
          console.log(`\n${skillId} instalado em .claude/skills/${skillId}/\n`);
        } catch (err) {
          console.log(
            `\nNão foi possível instalar ${skillId} automaticamente (verifique sua conexão/npm). ` +
              `Para instalar manualmente depois, rode:\n` +
              `  ${skillsCmd}\n`
          );
        }
      }
    }
  }
}

main().catch((err) => {
  console.error("Erro:", err);
  process.exit(1);
});
