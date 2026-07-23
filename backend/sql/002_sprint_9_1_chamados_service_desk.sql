UPDATE chamados SET status = 'Novo' WHERE status = 'Aberto';
UPDATE chamados SET status = 'Em Atendimento' WHERE status = 'Em andamento';
UPDATE chamados SET status = 'Resolvido' WHERE status = 'Concluído';

ALTER TABLE chamados
  ALTER COLUMN status SET DEFAULT 'Novo',
  ADD COLUMN responsavel_id INT NULL AFTER cliente_id,
  ADD INDEX idx_chamados_responsavel_id (responsavel_id),
  ADD CONSTRAINT fk_chamados_responsavel
    FOREIGN KEY (responsavel_id)
    REFERENCES usuarios (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  ADD CONSTRAINT chk_chamados_status
    CHECK (status IN (
      'Novo',
      'Em Atendimento',
      'Aguardando Cliente',
      'Resolvido',
      'Fechado',
      'Cancelado'
    )),
  ADD CONSTRAINT chk_chamados_prioridade
    CHECK (prioridade IN ('Crítica', 'Alta', 'Média', 'Baixa'));
