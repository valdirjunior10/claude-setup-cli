---
description: Finaliza uma implementação — roda revisão contra a spec, comita e {{FINALIZE_DESC_SUFFIX}}
---

1. Rodar o subagente `reviewer` sobre as mudanças da branch atual,
   validando contra `specs/<slug>/requirements.md` e `design.md`
   (não só padrões de código).
2. Se a tarefa foi classificada como sensível em `tasks.md`, rodar também
   o `adversarial-reviewer` (só spec + diff) e fazer a triagem dos achados:
   só os confirmados, com cenário de reprodução, voltam para correção.
3. Corrigir os pontos apontados, se houver, e rodar de novo o mesmo passe
   (máximo de 2 rodadas; se não convergir, reabrir `tasks.md`/`design.md`
   ou pedir direção ao usuário).
4. Marcar as subtarefas concluídas em `specs/<slug>/tasks.md`.
5. Confirmar que decisões relevantes foram registradas em
   @docs/architecture/decisions.md.
{{FINALIZE_STEPS}}
