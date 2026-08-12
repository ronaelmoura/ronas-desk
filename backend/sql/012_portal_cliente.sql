-- Portal do Cliente: uma conta de cliente por cadastro ativo.
-- A migration é idempotente para bancos que já receberam versões anteriores.

SET @cliente_id_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'usuarios'
    AND COLUMN_NAME = 'cliente_id'
);

SET @cliente_id_migration = IF(
  @cliente_id_exists = 0,
  'ALTER TABLE usuarios ADD COLUMN cliente_id INT NULL AFTER cargo',
  'SELECT ''cliente_id ja existe'' AS migration_status'
);

PREPARE portal_cliente_column_statement FROM @cliente_id_migration;
EXECUTE portal_cliente_column_statement;
DEALLOCATE PREPARE portal_cliente_column_statement;

SET @cliente_id_index_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'usuarios'
    AND INDEX_NAME = 'uk_usuarios_cliente_id'
);

SET @cliente_id_index_migration = IF(
  @cliente_id_index_exists = 0,
  'CREATE UNIQUE INDEX uk_usuarios_cliente_id ON usuarios (cliente_id)',
  'SELECT ''indice de cliente ja existe'' AS migration_status'
);

PREPARE portal_cliente_index_statement FROM @cliente_id_index_migration;
EXECUTE portal_cliente_index_statement;
DEALLOCATE PREPARE portal_cliente_index_statement;

SET @cliente_id_fk_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'usuarios'
    AND CONSTRAINT_NAME = 'fk_usuarios_cliente'
);

SET @cliente_id_fk_migration = IF(
  @cliente_id_fk_exists = 0,
  'ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_cliente FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE RESTRICT ON UPDATE CASCADE',
  'SELECT ''chave estrangeira de cliente ja existe'' AS migration_status'
);

PREPARE portal_cliente_fk_statement FROM @cliente_id_fk_migration;
EXECUTE portal_cliente_fk_statement;
DEALLOCATE PREPARE portal_cliente_fk_statement;
