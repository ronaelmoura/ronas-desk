CREATE TABLE auditoria (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  entidade VARCHAR(50) NOT NULL,
  entidade_id INT NOT NULL,
  usuario_id INT NULL,
  acao VARCHAR(50) NOT NULL,
  campo VARCHAR(50) NULL,
  valor_anterior TEXT NULL,
  valor_novo TEXT NULL,
  descricao VARCHAR(500) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_auditoria_entidade (entidade, entidade_id, created_at),
  INDEX idx_auditoria_usuario_id (usuario_id),
  CONSTRAINT fk_auditoria_usuario
    FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

CREATE TABLE comentarios (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  chamado_id INT NOT NULL,
  usuario_id INT NULL,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_comentarios_chamado (chamado_id, created_at),
  INDEX idx_comentarios_usuario_id (usuario_id),
  CONSTRAINT fk_comentarios_chamado
    FOREIGN KEY (chamado_id)
    REFERENCES chamados (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_comentarios_usuario
    FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT chk_comentarios_conteudo
    CHECK (CHAR_LENGTH(TRIM(conteudo)) BETWEEN 1 AND 2000)
);

INSERT INTO auditoria (
  entidade,
  entidade_id,
  usuario_id,
  acao,
  descricao,
  created_at
)
SELECT
  'chamado',
  chamados.id,
  NULL,
  'criacao',
  'Chamado criado.',
  chamados.created_at
FROM chamados;
