# Regra: finalização de demanda/implementação

Sempre que uma demanda/implementação for concluída, você deve, nesta
ordem:

1. Fazer o commit das mudanças na branch atual (`feature/<slug>`), com
   mensagem clara, seguindo @.claude/rules/convencoes.md.
2. Chamar o comando `/finalizar` em seguida — ele roda o `reviewer` contra
   a spec, fecha as subtarefas em `tasks.md`, confere o registro de
   decisões e encerra o fluxo (merge ou Pull Request, conforme configurado
   neste projeto).

Detalhes:
- Não pedir permissão para nenhum dos dois passos — assim como registrar
  decisões (@.claude/rules/registro-decisoes.md), isso faz parte de
  finalizar a tarefa.
- Não chame `/finalizar` com mudanças da implementação ainda sem commit, e
  não dê a tarefa por encerrada só com o commit — sem o `/finalizar` a spec
  e o registro de decisões ficam abertos.
- Vale para qualquer tamanho de tarefa, inclusive as pequenas e isoladas.
