---
description: Gera um guia de onboarding (rodar, entender e contribuir) em docs/onboarding.md
---

1. Inspecionar o projeto pra descobrir, sem perguntar o que já está
   visível no código: como instalar dependências, como rodar localmente,
   como rodar testes, variáveis de ambiente necessárias (ver
   `.env.example` se existir, ou gerar um apontamento de que falta).
2. Ler @CLAUDE.md, @docs/architecture/visao-geral.md e a lista de
   apps/camadas pra montar a seção de "como o projeto é organizado".
3. Gerar `docs/onboarding.md` com, no mínimo:
   - Pré-requisitos (linguagem/runtime, banco, ferramentas)
   - Passo a passo pra rodar localmente
   - Como rodar os testes
   - Estrutura do repositório em 3-5 linhas (não repetir o CLAUDE.md
     inteiro, só orientar onde procurar cada coisa)
   - Fluxo de trabalho: como abrir uma nova implementação
     (`/nova-implementacao`), branch de desenvolvimento
     ({{DEV_BRANCH}}), e como finalizar (`/finalizar`)
4. Se algo necessário pro setup não estiver claro no código (ex: uma
   variável de ambiente sem valor de exemplo, um serviço externo sem
   documentação de como obter credencial), listar como "pendências de
   onboarding" no final do arquivo, em vez de inventar um valor.
5. Não sobrescrever `docs/onboarding.md` se já existir — perguntar antes
   se deve atualizar ou criar uma versão nova pra revisão manual.
