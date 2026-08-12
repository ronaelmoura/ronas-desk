-- Novo marco de início do SLA para preservar ciclos após uma reabertura.
-- Registros legados permanecem compatíveis: quando o campo é nulo, o sistema
-- utiliza a data original de criação do chamado.

SET @sla_started_at_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'chamados'
    AND COLUMN_NAME = 'sla_started_at'
);

SET @sla_started_at_migration = IF(
  @sla_started_at_exists = 0,
  'ALTER TABLE chamados ADD COLUMN sla_started_at DATETIME NULL AFTER first_response_at',
  'SELECT ''sla_started_at já existe'' AS migration_status'
);

PREPARE sla_started_at_statement FROM @sla_started_at_migration;
EXECUTE sla_started_at_statement;
DEALLOCATE PREPARE sla_started_at_statement;
