-- Rode isto UMA VEZ, depois do schema.sql original, na mesma aba Query.
-- Adiciona os campos de controle de acesso/assinatura à tabela familias.

ALTER TABLE familias ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pendente';
-- status possíveis: 'pendente' (aguardando você liberar), 'ativo', 'bloqueado'

ALTER TABLE familias ADD COLUMN IF NOT EXISTS acesso_ate DATE;
-- data até quando o acesso vale. NULL = sem data definida (ex: seu próprio usuário master).

ALTER TABLE familias ADD COLUMN IF NOT EXISTS limite_usuarios INT NOT NULL DEFAULT 1;
-- quantas pessoas essa família pode cadastrar (de acordo com o plano contratado).

ALTER TABLE familias ADD COLUMN IF NOT EXISTS plano TEXT NOT NULL DEFAULT 'mensal';
-- 'mensal' ou 'anual', só pra você organizar.

ALTER TABLE familias ADD COLUMN IF NOT EXISTS observacoes TEXT;
-- anotações livres suas sobre esse cliente (forma de pagamento, combinados, etc).
