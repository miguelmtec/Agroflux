-- Rode isto UMA VEZ, depois dos schemas anteriores, na aba Query.
-- Permite que o administrador da família crie logins de verdade para
-- outros usuários, com senha provisória obrigatória a trocar no 1º acesso.

ALTER TABLE usuarios_auth ADD COLUMN IF NOT EXISTS senha_provisoria BOOLEAN NOT NULL DEFAULT false;
