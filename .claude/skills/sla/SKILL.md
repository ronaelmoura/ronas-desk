---
name: sla
description: Como o prazo de SLA do Ronas Desk é definido, calculado e exibido — limites por prioridade, os três status de SLA, o cálculo em JavaScript e a cópia em SQL que precisa ser mantida em sincronia. Use sempre que a tarefa envolver prazo, vencimento, tempo de resolução, tempo de primeira resposta, indicadores do dashboard, filtro por SLA ou o badge de prazo na tela — inclusive pedidos como "mudar o prazo da prioridade alta" ou "listar os chamados atrasados".
---

# SLA

O SLA é derivado, nunca digitado: ninguém grava "vence em tal hora" no banco.
O prazo sai da prioridade do chamado e o relógio começa em `sla_started_at`
(ou `created_at`, se aquele estiver vazio).

## Os limites

`backend/src/config/sla.js` é a fonte:

| Prioridade | Prazo |
|---|---|
| Crítica | 120 min (2h) |
| Alta | 480 min (8h) |
| Média | 1440 min (24h) |
| Baixa | 4320 min (72h) |

A partir de **80%** do prazo consumido (`PERCENTUAL_PROXIMO_VENCIMENTO`) o
chamado entra em alerta. Os três status são `Dentro do prazo`, `Próximo do
vencimento` e `Vencido` (`STATUS_SLA`).

## ⚠️ Os limites existem em dois lugares

Este é o ponto mais fácil de errar no projeto. Além do `config/sla.js`, os
mesmos números estão **escritos à mão num `CASE` SQL** dentro de
`chamadoModel.js`, no trecho que monta o filtro `sla_status`:

```sql
CASE chamados.prioridade
  WHEN 'Crítica' THEN 120
  WHEN 'Alta'    THEN 480
  WHEN 'Média'   THEN 1440
  WHEN 'Baixa'   THEN 4320
END
```

O `0.8` do alerta também está duplicado lá. Isso existe porque filtrar por SLA
no banco evita carregar todos os chamados para a memória — mas significa que
**alterar um prazo em `config/sla.js` e parar por aí deixa o filtro da tela de
chamados discordando da badge exibida no próprio card.** É uma divergência
silenciosa: nada quebra, os números só param de bater.

Ao mexer em qualquer limite, mude os dois lugares na mesma alteração e
confirme com um teste que cubra o filtro.

## Onde o cálculo acontece

Há duas rotas, de propósito:

- **Por chamado** — `slaService.calcular(chamado)` em JavaScript, e a resposta
  da API sempre sai por `slaService.enriquecerChamado` /
  `enriquecerChamados`, que anexam o objeto `sla`. É o que alimenta o badge e
  a barra de progresso.
- **Em agregado e em filtro** — SQL, no `chamadoModel` e nos models de
  dashboard e relatório. Contar vencidos ou filtrar uma lista grande em
  JavaScript exigiria trazer tudo para a memória.

O objeto `sla` devolvido tem `limitMinutes`, `elapsedMinutes`,
`remainingMinutes`, `percentage`, `displayPercentage` (limitado a 0–100, para
a barra), `status`, `dueAt`, `isOverdue` e `isResolved`.

## Regras que o cálculo encapsula

- **Chamado finalizado congela.** Em `Resolvido` ou `Fechado` o tempo conta
  até `resolved_at`, não até agora — senão todo chamado antigo apareceria
  vencido para sempre.
- **Reabrir reinicia o relógio.** `sla_started_at` é redefinido na transição
  de finalizado para ativo (ver a skill `chamado`).
- **Prioridade sem configuração lança `PrioridadeSlaInvalidaError`.** Falhar
  alto é intencional: um chamado sem prazo calculável é um bug de dados, não
  um caso a ser silenciado com um valor padrão.
- **`obterLimiteMinutos` é o ponto único de extensão.** Se um dia o prazo
  passar a variar por empresa, categoria ou contrato, é lá que a regra entra —
  não espalhada por controllers.

## Indicadores do dashboard

`slaService.calcularIndicadoresDashboard` devolve `sla_vencidos`,
`sla_proximos_vencimento`, `tempo_medio_resolucao_minutos` e
`tempo_medio_primeira_resposta_minutos`. Os dois contadores olham só chamados
**ativos** — um chamado resolvido com atraso não fica pesando no painel para
sempre. Médias sem amostra devolvem `null`, não `0`; a tela precisa distinguir
"nenhum dado" de "zero minutos".

O tempo de primeira resposta vem de `first_response_at`, que só é gravado por
comentário **público**.

## Frontend

Não recalcule prazo no cliente — consuma o objeto `sla` da API. Os componentes
prontos são `components/sla/SlaBadge.jsx`, `SlaCard.jsx` e `SlaProgress.jsx`,
com estilos em `components/sla/sla.css`.

## Ao terminar

`npm test --prefix backend` cobre o cálculo. Existe também uma suíte de
integração (`npm run test:integration --prefix backend`) que confere se o
`TIMESTAMPDIFF`/`CASE` do MySQL bate com os números esperados — ela exige um
MySQL descartável cujo `DB_NAME` termine em `_test`. Se você mexeu nos limites
duplicados, é essa suíte que pega a divergência.
