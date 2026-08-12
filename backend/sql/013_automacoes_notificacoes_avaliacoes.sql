-- Notificações internas e avaliações do atendimento.
-- Estruturas aditivas, idempotentes e seguras para reexecução.

CREATE TABLE IF NOT EXISTS notificacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  chamado_id INT NULL,
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(160) NOT NULL,
  mensagem VARCHAR(500) NOT NULL,
  lida_em DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notificacoes_usuario_leitura (usuario_id, lida_em, created_at),
  INDEX idx_notificacoes_chamado (chamado_id),
  CONSTRAINT fk_notificacoes_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_notificacoes_chamado
    FOREIGN KEY (chamado_id) REFERENCES chamados (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS avaliacoes_chamados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  chamado_id INT NOT NULL,
  cliente_id INT NOT NULL,
  nota TINYINT UNSIGNED NOT NULL,
  comentario VARCHAR(1000) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE INDEX uk_avaliacoes_chamados_chamado (chamado_id),
  INDEX idx_avaliacoes_chamados_cliente (cliente_id, created_at),
  CONSTRAINT chk_avaliacoes_chamados_nota CHECK (nota BETWEEN 1 AND 5),
  CONSTRAINT fk_avaliacoes_chamados_chamado
    FOREIGN KEY (chamado_id) REFERENCES chamados (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_avaliacoes_chamados_cliente
    FOREIGN KEY (cliente_id) REFERENCES clientes (id)
    ON DELETE RESTRICT
);
