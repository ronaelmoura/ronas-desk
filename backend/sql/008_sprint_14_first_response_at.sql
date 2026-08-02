-- Sprint 14: data real da primeira resposta pública ao chamado.
-- O backfill usa somente comentários públicos, pois comentários internos não
-- representam uma resposta visível ao cliente.

SET @first_response_at_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'chamados'
    AND COLUMN_NAME = 'first_response_at'
);

SET @first_response_at_migration = IF(
  @first_response_at_exists = 0,
  'ALTER TABLE chamados ADD COLUMN first_response_at DATETIME NULL AFTER resolved_at',
  'SELECT ''first_response_at já existe'' AS migration_status'
);

PREPARE first_response_at_statement FROM @first_response_at_migration;
EXECUTE first_response_at_statement;
DEALLOCATE PREPARE first_response_at_statement;

UPDATE chamados
INNER JOIN (
  SELECT
    chamado_id,
    MIN(created_at) AS first_response_at
  FROM comentarios
  WHERE tipo = 'PUBLICO'
  GROUP BY chamado_id
) AS primeiras_respostas
  ON primeiras_respostas.chamado_id = chamados.id
SET chamados.first_response_at = primeiras_respostas.first_response_at
WHERE chamados.first_response_at IS NULL;
