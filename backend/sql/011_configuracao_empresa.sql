-- Identidade visual da organização atual.
-- A tabela possui um único registro e preserva a marca atual como padrão.

CREATE TABLE IF NOT EXISTS configuracao_empresa (
  id TINYINT UNSIGNED NOT NULL,
  nome_empresa VARCHAR(120) NOT NULL,
  nome_central VARCHAR(120) NOT NULL,
  logo_url VARCHAR(500) NULL,
  cor_primaria CHAR(7) NOT NULL,
  cor_sidebar CHAR(7) NOT NULL,
  mensagem_boas_vindas VARCHAR(220) NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT chk_configuracao_empresa_unica CHECK (id = 1)
);

INSERT IGNORE INTO configuracao_empresa (
  id,
  nome_empresa,
  nome_central,
  logo_url,
  cor_primaria,
  cor_sidebar,
  mensagem_boas_vindas
) VALUES (
  1,
  'Ronas Desk',
  'Central de suporte',
  NULL,
  '#147ee8',
  '#081525',
  'Centralize solicitações e resolva cada atendimento com clareza.'
);
