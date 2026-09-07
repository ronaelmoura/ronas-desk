---
name: chamado
description: Como criar, atualizar, comentar, anexar e excluir chamados no Ronas Desk — o padrão de transação, o histórico auditável, as notificações e as regras de transição de status. Use sempre que a tarefa tocar chamados, tickets, status, prioridade, responsável, comentários, anexos ou timeline, mesmo que o pedido não use a palavra "chamado" — por exemplo, "marcar como resolvido", "atribuir ao atendente" ou "adicionar observação interna".
---

# Chamados

O chamado é a entidade central do Ronas Desk. Quase toda regra de negócio do
produto passa por ele, e é por isso que o caminho de escrita é rígido: um
chamado gravado sem histórico ou sem notificação é uma inconsistência que
ninguém detecta na hora, só semanas depois numa auditoria.

## Vocabulário

- **Status** — `Novo`, `Em Atendimento`, `Aguardando Cliente`, `Resolvido`,
  `Fechado`, `Cancelado`. `Resolvido` e `Fechado` são os *finalizados*
  (`STATUS_FINALIZADOS` em `config/sla.js`).
- **Prioridade** — `Crítica`, `Alta`, `Média`, `Baixa`. Define o prazo de SLA.
- **Categoria** — `Hardware`, `Software`, `Rede`, `Acesso`, `Outro`.
- **Comentário** — tem `tipo` `PUBLICO` (o cliente vê no portal) ou `INTERNO`
  (só a equipe). A escolha errada vaza conversa interna para o cliente.

As listas canônicas do frontend estão em `frontend/src/utils/chamados.js`.

## O caminho de escrita

Toda gravação de chamado segue esta sequência. Ela existe porque histórico e
notificação precisam cair junto com o dado — se o commit falhar no meio, nada
pode sobrar pela metade.

```js
let conexao
try {
  conexao = await pool.getConnection()
  await conexao.beginTransaction()

  // trava a linha e devolve o estado anterior, que o histórico precisa
  const existente = await chamadoModel.buscarPorIdParaAtualizacao(id, conexao)
  if (!existente) { await conexao.rollback(); /* 404 */ }

  const chamado = await chamadoModel.atualizar(id, { /* ... */ }, conexao)

  await historyService.registrarAtualizacao(existente, chamado, usuarioId, conexao)
  await notificacaoService.atualizacaoChamado(existente, chamado, usuarioId, conexao)

  await conexao.commit()
  return response.status(200).json(slaService.enriquecerChamado(chamado))
} catch (error) {
  if (conexao) await conexao.rollback()
  // 500 com { status: 'erro', message }
} finally {
  conexao?.release()
}
```

Quatro detalhes que costumam ser esquecidos:

- **`buscarPorIdParaAtualizacao`, não `buscarPorId`.** Ela trava a linha e
  devolve o estado anterior, que o histórico compara para saber o que mudou.
- **A conexão é repassada a tudo.** Todo model e service aceita `executor`
  como último parâmetro. Chamar sem passar `conexao` roda fora da transação e
  o rollback não desfaz.
- **`historyService` e `notificacaoService` são parte da escrita**, não um
  extra opcional. Na criação são `registrarCriacao` e `novoChamado`.
- **A resposta passa por `slaService.enriquecerChamado`.** O frontend espera o
  campo `sla` calculado; sem ele o badge de prazo some da tela.

## Nunca calcule `resolved_at` nem `sla_started_at` na mão

Esses dois campos derivam da transição de status e têm um service só para
isso, porque a regra é sutil:

```js
resolved_at: resolucaoChamadoService.determinarResolvedAt(
  statusAnterior, statusNovo, resolvedAtAtual,
),
sla_started_at: resolucaoChamadoService.determinarSlaStartedAt(
  statusAnterior, statusNovo, slaStartedAtAtual,
),
```

O que eles garantem: sair de finalizado limpa `resolved_at`; reentrar em
finalizado que já era finalizado preserva a data original (não "re-resolve" o
chamado); e reabrir um chamado reinicia o relógio do SLA. Reimplementar isso
inline sempre erra pelo menos um desses casos.

## Reabertura automática

Quando o cliente comenta num chamado `Resolvido` ou `Fechado`, o chamado
**reabre sozinho** para `Em Atendimento` e o SLA reinicia. Isso vive em
`reaberturaChamadoService.aoReceberRespostaCliente` e é chamado pelo portal.
Se você criar outro caminho pelo qual o cliente se manifesta, chame esse
service — não replique a lógica.

## Primeira resposta

`first_response_at` alimenta o indicador de tempo de primeira resposta e é
gravado só por **comentário público**, via
`primeiraRespostaService.registrarSeAplicavel`. O UPDATE é monotônico: só
grava se estiver vazio ou se a data nova for anterior. Comentário interno não
conta como resposta ao cliente e não deve marcar esse campo.

## Exclusão

`DELETE /api/chamados/:id` é exclusivo de Administrador (`adminMiddleware`) e
**falha com 409 se o chamado ainda tiver anexos**. A mensagem pede para
excluir os anexos antes. Isso é proposital: anexo órfão no Cloudinary não tem
como ser rastreado depois.

## Onde as coisas ficam

| | |
|---|---|
| Rotas | `backend/src/routes/chamados.routes.js` |
| Controllers | `chamadosController.js`, `chamadoInteracoesController.js`, `anexosController.js` |
| Services | `resolucaoChamadoService`, `reaberturaChamadoService`, `primeiraRespostaService`, `historyService`, `notificacaoService` |
| Models | `chamadoModel.js`, `comentarioModel.js`, `anexoModel.js` |
| Frontend | `components/TicketDetailsModal.jsx`, `NewTicketModal.jsx`, `AllTickets.jsx`, `services/chamadosApi.js` |

Histórico auditável é decisão registrada — veja `docs/adr/0005-historico-auditavel-de-chamados.md`.

## Ao terminar

Rode `npm test --prefix backend`. Se mexeu em transição de status, cubra no
teste o caminho de ida e o de volta (finalizar e reabrir) — é onde
`resolved_at` e `sla_started_at` costumam divergir.
