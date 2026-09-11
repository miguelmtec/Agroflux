-- Rode isto UMA VEZ, depois dos schema.sql e schema_v2.sql, na aba Query.
-- Cria a tabela onde ficam guardados os backups automáticos e manuais.

CREATE TABLE IF NOT EXISTS backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  familia_id UUID NOT NULL REFERENCES familias(id) ON DELETE CASCADE,
  nome_familia TEXT NOT NULL,
  dados JSONB NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'automatico', -- 'automatico' ou 'manual'
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_backups_familia ON backups(familia_id, criado_em DESC);
