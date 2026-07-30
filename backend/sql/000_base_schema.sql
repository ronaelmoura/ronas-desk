-- Estrutura mínima original necessária antes das migrations versionadas.
-- O script é seguro para bancos existentes porque cria apenas tabelas ausentes.

CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(254) NOT NULL,
  telefone VARCHAR(20) NULL,
  empresa VARCHAR(150) NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX uk_clientes_email (email)
);

CREATE TABLE IF NOT EXISTS chamados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  prioridade VARCHAR(20) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Aberto',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_chamados_cliente_id (cliente_id),
  CONSTRAINT fk_chamados_cliente
    FOREIGN KEY (cliente_id)
    REFERENCES clientes (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);
