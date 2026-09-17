---
description: Gera um diagrama Mermaid de arquitetura ou fluxo a partir do código atual
---

1. Perguntar o escopo se não estiver claro no pedido: arquitetura geral
   do sistema, fluxo de uma feature específica, ou modelo de dados de uma
   camada.
2. Ler o código relevante (não assumir estrutura — inspecionar
   diretórios, rotas, models/entidades conforme o escopo pedido).
3. Gerar um diagrama Mermaid (`graph`, `sequenceDiagram` ou `erDiagram`,
   conforme o escopo) representando o que foi encontrado — não o que
   "deveria" existir segundo @docs/architecture/visao-geral.md, mas o
   estado real do código.
4. Salvar em `docs/architecture/diagramas/<slug>.md` dentro de um bloco
   ```` ```mermaid ```` , com uma frase de contexto acima explicando o que
   o diagrama mostra e a data de geração.
5. Se o diagrama revelar uma divergência entre o código e
   `docs/architecture/visao-geral.md` (ex: uma camada nova não
   documentada), avisar o usuário — não corrigir a visão geral sozinho
   sem confirmação.
