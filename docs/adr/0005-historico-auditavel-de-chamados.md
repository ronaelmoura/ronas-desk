# ADR 0005: Histórico auditável de chamados

- Status: Aceito
- Tipo: ADR retrospectivo

## Contexto

O Ronas Desk mantém um histórico estruturado de eventos dos chamados em `ticket_history`, em vez de depender apenas do estado atual da entidade. O serviço `backend/src/services/historyService.js` define uma lista fixa de eventos como `CHAMADO_CRIADO`, `CHAMADO_ATUALIZADO`, `STATUS_ALTERADO`, `PRIORIDADE_ALTERADA`, `RESPONSAVEL_ALTERADO`, `CLIENTE_ALTERADO`, `CHAMADO_RESOLVIDO`, `CHAMADO_FECHADO`, `CHAMADO_REABERTO`, `COMENTARIO_ADICIONADO`, `ANEXO_ADICIONADO` e `ANEXO_REMOVIDO`.

A tabela criada em `backend/sql/006_sprint_9_4_ticket_history.sql` registra, para cada evento, `ticket_id`, `user_id`, `event_type`, `description`, `old_values`, `new_values`, `source_audit_id` e `created_at`. Os valores anteriores e novos são codificados em JSON, e a estrutura permite consultar a linha do tempo por chamado. O `DEVLOG.md` registra a Sprint 9.4 como "Auditoria e timeline de chamados", reforçando que esse histórico foi objetivo de negócio e não apenas um detalhe opcional de implementação.

O código também mostra que esse histórico participa da mesma operação transactional principal. Em vários controllers e services de chamados, o registro do histórico é chamado junto com a operação principal, e o `executor` de banco recebido pelo service permite que a inserção do evento faça parte da mesma transação. Isso reduz a chance de o chamado ser atualizado sem registrar a alteração correspondente.

## Decisão

O projeto optou por manter um histórico estruturado de eventos de chamado em vez de preservar apenas o estado atual. Cada alteração relevante do chamado gera um evento registrado em `ticket_history`, com:

- `ticket_id`: identificação do chamado afetado;
- `user_id`: usuário que causou a ação;
- `event_type`: tipo do evento;
- `description`: texto simples da ocorrência;
- `old_values`: valores anteriores, quando relevantes;
- `new_values`: valores novos, quando relevantes;
- JSON para representar mudanças complexas ou objetos aninhados;
- `created_at`: marcação temporal do evento.

Esse padrão cobre tanto a criação do chamado quanto mudanças nos campos principais, comentários, anexos, resolução, fechamento e reabertura. A implementação não é Event Sourcing completo: ela preserva uma linha do tempo de eventos úteis para auditoria e exibição, mas não substitui o modelo de estado atual do chamado nem pretende ser uma máquina de eventos completa.

## Alternativas consideradas

- Manter somente o estado atual: mais simples, mas insuficiente para acompanhar quem alterou o que, quando e em quais valores. O projeto tem forte necessidade de auditoria e análise operacional.
- Usar apenas logs da aplicação: útil para diagnóstico, porém insuficiente para traçar a timeline de negócio do chamado com estrutura e consulta por evento.
- Adotar Event Sourcing completo: uma estratégia mais poderosa para reconstituição de estado e auditoria histórica, mas muito mais ampla do que o que o sistema atual implementa. O Ronas Desk usa um histórico de eventos direcionado a auditoria e na tela de detalhes do chamado, e não um modelo de event sourcing end-to-end.

## Consequências positivas

- Há rastreabilidade completa das alterações no chamado, incluindo criação, atualização, comentários, anexos e transições de status.
- A timeline pode ser consultada para suporte, análise e revisão de operações sem depender de leitura manual do estado atual.
- O uso de JSON para `old_values` e `new_values` permite guardar estruturas e diffs sem exigir uma tabela separada para cada tipo de alteração.
- A gravação do histórico com a mesma conexão transacional reduz a chance de divergência entre a mudança principal e a auditoria.

## Consequências negativas

- O histórico aumenta o volume de dados e exige manutenção de índices e estrutura de consulta.
- O código precisa decidir com disciplina quais eventos são relevantes e qual formato JSON será usado para cada alteração, o que aumenta a complexidade do service.
- A implementação não é um Event Sourcing completo e, portanto, não oferece a mesma capacidade de reconstituição e replay de eventos que esse modelo mais sofisticado oferece.
- O projeto mantém a exclusão física de chamados em conjunto com a tabela de histórico, o que exige cuidado para evitar inconsistências entre o estado atual e a linha do tempo.
