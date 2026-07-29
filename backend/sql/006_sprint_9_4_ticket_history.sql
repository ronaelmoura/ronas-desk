-- Sprint 9.4: histórico estruturado dos chamados.
-- A tabela usa ON DELETE CASCADE para permanecer compatível com a exclusão
-- física de chamados adotada atualmente pelo projeto.

CREATE TABLE IF NOT EXISTS ticket_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  user_id INT NULL,
  event_type VARCHAR(50) NOT NULL,
  description VARCHAR(500) NOT NULL,
  old_values JSON NULL,
  new_values JSON NULL,
  source_audit_id BIGINT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE INDEX uk_ticket_history_source_audit_id (source_audit_id),
  INDEX idx_ticket_history_ticket_created (ticket_id, created_at, id),
  INDEX idx_ticket_history_user_id (user_id),
  CONSTRAINT fk_ticket_history_ticket
    FOREIGN KEY (ticket_id)
    REFERENCES chamados (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_ticket_history_user
    FOREIGN KEY (user_id)
    REFERENCES usuarios (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

-- Preserva a timeline já existente. source_audit_id torna o backfill
-- idempotente e o JOIN evita importar auditorias de chamados já excluídos.
INSERT INTO ticket_history (
  ticket_id,
  user_id,
  event_type,
  description,
  old_values,
  new_values,
  source_audit_id,
  created_at
)
SELECT
  auditoria.entidade_id,
  auditoria.usuario_id,
  CASE auditoria.acao
    WHEN 'criacao' THEN 'CHAMADO_CRIADO'
    WHEN 'alteracao_status' THEN 'STATUS_ALTERADO'
    WHEN 'alteracao_prioridade' THEN 'PRIORIDADE_ALTERADA'
    WHEN 'alteracao_responsavel' THEN 'RESPONSAVEL_ALTERADO'
    WHEN 'comentario' THEN 'COMENTARIO_ADICIONADO'
    WHEN 'exclusao' THEN 'CHAMADO_EXCLUIDO'
    ELSE 'CHAMADO_ATUALIZADO'
  END,
  auditoria.descricao,
  CASE
    WHEN auditoria.valor_anterior IS NULL THEN NULL
    ELSE JSON_OBJECT(COALESCE(auditoria.campo, 'valor'), auditoria.valor_anterior)
  END,
  CASE
    WHEN auditoria.valor_novo IS NULL THEN NULL
    ELSE JSON_OBJECT(COALESCE(auditoria.campo, 'valor'), auditoria.valor_novo)
  END,
  auditoria.id,
  auditoria.created_at
FROM auditoria
INNER JOIN chamados
  ON chamados.id = auditoria.entidade_id
WHERE auditoria.entidade = 'chamado'
  AND NOT EXISTS (
    SELECT 1
    FROM ticket_history
    WHERE ticket_history.source_audit_id = auditoria.id
  );
