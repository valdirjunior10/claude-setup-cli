# Regra: plano e autorização antes de implementar

Jamais implemente nada (código, migrations, configurações) sem antes:

1. Montar o plano do que vai ser feito — para tarefa não trivial, o
   conjunto `specs/<slug>/` (requirements + design + tasks, ver
   @specs/README.md); para tarefa simples e isolada, um plano mínimo de
   uma frase basta.
2. Apresentar o plano ao usuário e aguardar a autorização dele.
3. Somente depois de autorizado, realizar a implementação.

Detalhes:
- Autorização é o usuário aprovando o plano de forma explícita. O pedido
  original ("faça X") não conta como aprovação, nem o silêncio.
- Se durante a implementação o escopo mudar (nova camada, nova migration,
  decisão fora do plano), pare, atualize o plano e peça autorização de
  novo antes de continuar.
- Se o usuário pedir ajustes no plano, revise e reapresente — não
  implemente parcialmente "enquanto isso".
- Ler e explorar o código e montar o plano (inclusive os arquivos de
  `specs/<slug>/`) não exigem autorização; só a implementação exige.
- Se o projeto roda em Plan Mode (`defaultMode: "plan"` em
  `.claude/settings.json`), a aprovação do plano já é o gate do próprio
  Claude Code — esta regra vale também fora dele.
- Vale para qualquer tamanho de tarefa, inclusive as pequenas e isoladas.
