-- Estatísticas anônimas de navegação para o painel administrativo.
-- O identificador de sessão é recebido como valor aleatório e armazenado
-- somente após hash. Endereços IP não são persistidos.

CREATE TABLE IF NOT EXISTS visitas (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sessao_hash CHAR(64) NOT NULL,
  pagina VARCHAR(80) NOT NULL,
  pais VARCHAR(100) NOT NULL DEFAULT 'Não identificado',
  regiao VARCHAR(120) NOT NULL DEFAULT 'Não identificada',
  origem VARCHAR(180) NOT NULL DEFAULT 'Acesso direto',
  dispositivo ENUM('Computador', 'Celular', 'Tablet', 'Outro') NOT NULL DEFAULT 'Outro',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_visitas_sessao_pagina (sessao_hash, pagina),
  KEY idx_visitas_created_at (created_at),
  KEY idx_visitas_pais_regiao (pais, regiao),
  KEY idx_visitas_pagina (pagina)
);
