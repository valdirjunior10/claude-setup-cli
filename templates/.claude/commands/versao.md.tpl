---
description: Detecta a stack, sugere o bump de versão e gera changelog, com gate de aprovação antes do push
---

1. Detectar o arquivo de versão pela stack do projeto:
   - `package.json` (Node/React/Angular) → campo `version`
   - `composer.json` (Laravel/PHP) → campo `version`
   - `pyproject.toml` (Python) → `[project] version`
   - outro manifesto → perguntar ao usuário onde fica a versão

2. Analisar os commits desde a última tag (`git log <última-tag>..HEAD`)
   e classificar por Conventional Commits:
   - `fix:` → patch
   - `feat:` → minor
   - `BREAKING CHANGE:` ou `!` → major

3. Sugerir o bump e **perguntar confirmação** antes de aplicar — nunca
   decidir sozinho entre minor/major sem o usuário confirmar quando há
   ambiguidade.

4. Atualizar o arquivo de versão e gerar/atualizar `CHANGELOG.md` com as
   mudanças desde a última tag, agrupadas por tipo (Features, Fixes,
   Breaking Changes).

5. Commit do bump + changelog na branch atual, mensagem
   `chore(release): vX.Y.Z`.

6. **Parar aqui.** Não dar push, não criar tag, e não promover pra
   `{{RELEASE_BRANCH}}` — isso é feito à parte (merge manual de
   `{{DEV_BRANCH}}` pra `{{RELEASE_BRANCH}}`, ou pelo usuário quando
   decidir publicar). Quando o commit de release chegar em
   `{{RELEASE_BRANCH}}`, a GitHub Action
   (`.github/workflows/auto-tag.yml`) cria a tag automaticamente e o
   Dokploy dispara o deploy a partir dela.
