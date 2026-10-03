---
description: Inicia uma nova implementação — sempre via o agente architect, seguindo o fluxo spec-driven do projeto
---

Fluxo para nova implementação em {{PROJECT_NAME}}:

1. Acionar o subagente `architect` com o pedido do usuário tal como
   recebido — sem pré-filtrar se é simples ou complexo, essa decisão é
   dele.
2. O `architect` cuida do fluxo completo (ver @specs/README.md):
   specify (análise da demanda) → clarify → plan → tasks (plano de ação e
   classificação simples/comum/sensível) → criar branch `feature/<slug>` →
   implement (delegando para os agentes especializados) → validate
   (`reviewer` contra a spec, não só contra padrões de código; em tarefa
   sensível, também o `adversarial-reviewer`).
3. Reportar ao usuário apenas o resumo final entregue pelo `architect`
   — não repetir o processo interno de delegação.
