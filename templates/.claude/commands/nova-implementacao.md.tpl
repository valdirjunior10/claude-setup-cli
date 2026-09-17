---
description: Inicia uma nova implementação — sempre via o agente orchestrator, seguindo o fluxo spec-driven do projeto
---

Fluxo para nova implementação em {{PROJECT_NAME}}:

1. Acionar o subagente `orchestrator` com o pedido do usuário tal como
   recebido — sem pré-filtrar se é simples ou complexo, essa decisão é
   dele.
2. O `orchestrator` cuida do fluxo completo (ver @specs/README.md):
   specify → clarify → plan → tasks → criar branch `feature/<slug>` →
   implement (delegando para os agentes especializados) → validate
   (`reviewer` contra a spec, não só contra padrões de código).
3. Reportar ao usuário apenas o resumo final entregue pelo `orchestrator`
   — não repetir o processo interno de delegação.
