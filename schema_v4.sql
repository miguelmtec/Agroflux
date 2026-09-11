-- Rode isto UMA VEZ, depois dos schemas anteriores, na aba Query.
-- Adiciona proteção contra força bruta e permite revogar sessões.

ALTER TABLE usuarios_auth ADD COLUMN IF NOT EXISTS tentativas_falhas INT NOT NULL DEFAULT 0;
ALTER TABLE usuarios_auth ADD COLUMN IF NOT EXISTS bloqueado_ate TIMESTAMPTZ;
ALTER TABLE usuarios_auth ADD COLUMN IF NOT EXISTS sessao_versao INT NOT NULL DEFAULT 1;
