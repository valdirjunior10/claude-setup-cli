# Registro de decisões — {{PROJECT_NAME}}

> Log append-only de decisões de arquitetura. Nunca edite ou apague uma
> entrada antiga — se uma decisão for revertida, adicione uma nova entrada
> referenciando a anterior.
>
> Este arquivo é atualizado automaticamente pelos agentes durante o
> desenvolvimento (ver instrução em `.claude/rules/registro-decisoes.md`)
> e também pode ser atualizado manualmente com `/registrar-decisao`.

## Formato de cada entrada

```
## [AAAA-MM-DD] Título curto da decisão
- Contexto: por que essa decisão precisou ser tomada
- Decisão: o que foi decidido
- Alternativas descartadas: o que mais foi considerado e por que não foi escolhido
- Impacto: o que isso muda no código/arquitetura existente
```

---

<!-- novas entradas são adicionadas abaixo desta linha -->
