-- Sprint 9.3: data real de resolução/fechamento.
-- Chamados legados encerrados permanecem com resolved_at NULL de propósito:
-- não existe uma data histórica confiável para preencher automaticamente.

SET @resolved_at_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'chamados'
    AND COLUMN_NAME = 'resolved_at'
);

SET @resolved_at_migration = IF(
  @resolved_at_exists = 0,
  'ALTER TABLE chamados ADD COLUMN resolved_at DATETIME NULL AFTER updated_at',
  'SELECT ''resolved_at já existe'' AS migration_status'
);

PREPARE resolved_at_statement FROM @resolved_at_migration;
EXECUTE resolved_at_statement;
DEALLOCATE PREPARE resolved_at_statement;
