ALTER TABLE comentarios
  ADD COLUMN tipo VARCHAR(10) NOT NULL DEFAULT 'INTERNO' AFTER conteudo,
  ADD CONSTRAINT chk_comentarios_tipo
    CHECK (tipo IN ('PUBLICO', 'INTERNO'));
