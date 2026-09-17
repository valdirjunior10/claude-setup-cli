# Specs — {{PROJECT_NAME}}

Cada feature/tarefa não trivial ganha uma pasta própria aqui, no formato
`specs/<slug-da-feature>/`, contendo três arquivos:

```
specs/<slug-da-feature>/
  requirements.md   — o que precisa ser feito e por quê
  design.md          — como será feito (decisões técnicas, impacto)
  tasks.md            — quebra em subtarefas executáveis
```

Não crie pastas separadas por tipo (`specs/requirements/`,
`specs/design/`) — os três arquivos de uma mesma feature ficam sempre
juntos, na pasta da feature. O slug da pasta é o mesmo usado na branch
(`feature/<slug>`).

## Fluxo (gerado pelo agente `orchestrator`)
1. **specify** — `requirements.md`: contexto, requisitos, critério de
   conclusão.
2. **clarify** — antes de seguir para o design, o `orchestrator` confirma
   com o usuário qualquer ambiguidade encontrada nos requisitos.
3. **plan** — `design.md`: decisões técnicas, trade-offs, impacto em
   outras camadas/apps.
4. **tasks** — `tasks.md`: lista de subtarefas, cada uma já mapeada para
   o agente especializado que vai executá-la.
5. **implement** — delegação para os agentes especializados.
6. **validate** — o `reviewer` confirma que a implementação satisfaz o
   que está em `requirements.md` e `design.md`, não só padrões de código.

Specs concluídas não são apagadas — servem de histórico e documentação
viva de por que a feature foi construída daquele jeito.
