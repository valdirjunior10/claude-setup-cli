---
description: Finaliza uma implementação — roda revisão contra a spec, comita e {{FINALIZE_DESC_SUFFIX}}
---

1. Rodar o subagente `reviewer` sobre as mudanças da branch atual,
   validando contra `specs/<slug>/requirements.md` e `design.md`
   (não só padrões de código).
2. Corrigir os pontos apontados, se houver, e rodar o `reviewer` de novo.
3. Marcar as subtarefas concluídas em `specs/<slug>/tasks.md`.
4. Confirmar que decisões relevantes foram registradas em
   @docs/architecture/decisions.md.
{{FINALIZE_STEPS}}
