-- Sprint 9.5: anexos privados em chamados.
-- O arquivo permanece no Cloudinary; esta tabela guarda somente os metadados
-- necessários para autorização, auditoria e geração de links temporários.

CREATE TABLE IF NOT EXISTS anexos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  chamado_id INT NOT NULL,
  usuario_id INT NULL,
  nome_original VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  tamanho_bytes BIGINT UNSIGNED NOT NULL,
  cloudinary_public_id VARCHAR(255) NOT NULL,
  cloudinary_asset_id VARCHAR(64) NOT NULL,
  formato VARCHAR(20) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE INDEX uk_anexos_cloudinary_public_id (cloudinary_public_id),
  UNIQUE INDEX uk_anexos_cloudinary_asset_id (cloudinary_asset_id),
  INDEX idx_anexos_chamado_created (chamado_id, created_at, id),
  INDEX idx_anexos_usuario_id (usuario_id),
  CONSTRAINT fk_anexos_chamado
    FOREIGN KEY (chamado_id)
    REFERENCES chamados (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_anexos_usuario
    FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT chk_anexos_tamanho
    CHECK (tamanho_bytes BETWEEN 1 AND 10485760)
);
