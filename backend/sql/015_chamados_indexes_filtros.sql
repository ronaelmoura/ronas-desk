-- Índices de suporte para os filtros e ordenações mais usados em chamados:
-- listagem paginada, dashboard e relatórios filtram por status, prioridade,
-- categoria e período, e ordenam por data de criação.

SET @idx_status_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'chamados'
    AND INDEX_NAME = 'idx_chamados_status'
);

SET @idx_status_migration = IF(
  @idx_status_exists = 0,
  'CREATE INDEX idx_chamados_status ON chamados (status)',
  'SELECT ''idx_chamados_status ja existe'' AS migration_status'
);

PREPARE idx_status_statement FROM @idx_status_migration;
EXECUTE idx_status_statement;
DEALLOCATE PREPARE idx_status_statement;

SET @idx_prioridade_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'chamados'
    AND INDEX_NAME = 'idx_chamados_prioridade'
);

SET @idx_prioridade_migration = IF(
  @idx_prioridade_exists = 0,
  'CREATE INDEX idx_chamados_prioridade ON chamados (prioridade)',
  'SELECT ''idx_chamados_prioridade ja existe'' AS migration_status'
);

PREPARE idx_prioridade_statement FROM @idx_prioridade_migration;
EXECUTE idx_prioridade_statement;
DEALLOCATE PREPARE idx_prioridade_statement;

SET @idx_created_at_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'chamados'
    AND INDEX_NAME = 'idx_chamados_created_at'
);

SET @idx_created_at_migration = IF(
  @idx_created_at_exists = 0,
  'CREATE INDEX idx_chamados_created_at ON chamados (created_at)',
  'SELECT ''idx_chamados_created_at ja existe'' AS migration_status'
);

PREPARE idx_created_at_statement FROM @idx_created_at_migration;
EXECUTE idx_created_at_statement;
DEALLOCATE PREPARE idx_created_at_statement;

SET @idx_categoria_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'chamados'
    AND INDEX_NAME = 'idx_chamados_categoria'
);

SET @idx_categoria_migration = IF(
  @idx_categoria_exists = 0,
  'CREATE INDEX idx_chamados_categoria ON chamados (categoria)',
  'SELECT ''idx_chamados_categoria ja existe'' AS migration_status'
);

PREPARE idx_categoria_statement FROM @idx_categoria_migration;
EXECUTE idx_categoria_statement;
DEALLOCATE PREPARE idx_categoria_statement;
