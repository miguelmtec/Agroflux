-- SCHEMA COMPLETO do AgroFlux — todas as tabelas e colunas até hoje.
-- Rodar isto de uma vez só é seguro mesmo que parte já exista (todos os
-- comandos usam IF NOT EXISTS), então serve tanto pra configurar um banco
-- novo do zero quanto pra conferir se algum schema anterior ficou faltando.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- schema.sql
CREATE TABLE IF NOT EXISTS familias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_familia TEXT NOT NULL,
  dados JSONB NOT NULL DEFAULT '{}'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usuarios_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  nome TEXT NOT NULL,
  familia_id UUID NOT NULL REFERENCES familias(id) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_auth_familia ON usuarios_auth(familia_id);

-- schema_v2.sql (controle de acesso/assinatura)
ALTER TABLE familias ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pendente';
ALTER TABLE familias ADD COLUMN IF NOT EXISTS acesso_ate DATE;
ALTER TABLE familias ADD COLUMN IF NOT EXISTS limite_usuarios INT NOT NULL DEFAULT 1;
ALTER TABLE familias ADD COLUMN IF NOT EXISTS plano TEXT NOT NULL DEFAULT 'mensal';
ALTER TABLE familias ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- schema_v3.sql (backups)
CREATE TABLE IF NOT EXISTS backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  familia_id UUID NOT NULL REFERENCES familias(id) ON DELETE CASCADE,
  nome_familia TEXT NOT NULL,
  dados JSONB NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'automatico',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_backups_familia ON backups(familia_id, criado_em DESC);

-- schema_v4.sql (força bruta / revogação de sessão)
ALTER TABLE usuarios_auth ADD COLUMN IF NOT EXISTS tentativas_falhas INT NOT NULL DEFAULT 0;
ALTER TABLE usuarios_auth ADD COLUMN IF NOT EXISTS bloqueado_ate TIMESTAMPTZ;
ALTER TABLE usuarios_auth ADD COLUMN IF NOT EXISTS sessao_versao INT NOT NULL DEFAULT 1;

-- schema_v5.sql (senha provisória)
ALTER TABLE usuarios_auth ADD COLUMN IF NOT EXISTS senha_provisoria BOOLEAN NOT NULL DEFAULT false;
