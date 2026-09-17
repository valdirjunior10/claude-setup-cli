# Regra: registro automático de decisões

Sempre que, durante uma implementação, você tomar ou identificar uma
decisão de arquitetura relevante (ex: escolha de padrão, trade-off entre
duas abordagens, mudança que afeta múltiplos módulos, decisão que alguém
vai perguntar "por que foi feito assim" no futuro), você deve:

1. Antes de finalizar a tarefa, adicionar uma entrada em
   `docs/architecture/decisions.md`, seguindo exatamente o formato descrito
   no topo daquele arquivo.
2. Não perguntar permissão para registrar — registrar faz parte de
   finalizar a tarefa, assim como rodar o `reviewer`.
3. NÃO registrar: preferências de estilo, detalhes de implementação sem
   trade-off real, ou nada que já esteja coberto por uma regra existente
   em `.claude/rules/`. O log é para decisões, não para changelog de código.
4. Se a tarefa não envolveu nenhuma decisão nova (só implementação direta
   de algo já padronizado), não crie entrada — não adicionar é o
   comportamento correto nesse caso.
