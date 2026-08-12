-- Conta de demonstração somente leitura.
-- A conta é marcada manualmente após ser criada; nenhuma credencial é
-- armazenada nesta migration.

SET @is_demo_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'usuarios'
    AND COLUMN_NAME = 'is_demo'
);

SET @is_demo_migration = IF(
  @is_demo_exists = 0,
  'ALTER TABLE usuarios ADD COLUMN is_demo BOOLEAN NOT NULL DEFAULT FALSE AFTER ativo',
  'SELECT ''is_demo já existe'' AS migration_status'
);

PREPARE is_demo_statement FROM @is_demo_migration;
EXECUTE is_demo_statement;
DEALLOCATE PREPARE is_demo_statement;
