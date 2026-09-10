# Publicar e configurar o AgroFlux (Vercel + Postgres)

## 1. Subir o código
Suba os arquivos deste projeto para um repositório no GitHub (veja instruções
que te passei separadamente), depois:

- Entre em vercel.com → **Add New → Project** → autorize o GitHub → selecione
  o repositório.
- Deixe as configurações padrão (a Vercel detecta Vite sozinha) → **Deploy**.

## 2. Criar o banco de dados
- Dentro do projeto na Vercel, vá na aba **Storage** → **Create Database** →
  escolha **Postgres** (ou "Neon", é a mesma coisa) → confirme a região →
  **Connect** ao seu projeto.
- Isso já cadastra sozinho a variável `POSTGRES_URL` no seu projeto.

## 3. Criar as tabelas
- Ainda na aba Storage do seu banco, procure a aba **Query** (ou "SQL Editor").
- Abra o arquivo `schema.sql` (está na raiz deste projeto), copie todo o
  conteúdo, cole ali e rode. Isso cria as tabelas `familias` e `usuarios_auth`.

## 4. Definir a chave de sessão
- Gere um texto aleatório longo (qualquer gerador de senha forte serve, ou
  rode `openssl rand -base64 32` se tiver terminal Mac/Linux).
- Na Vercel: **Project Settings → Environment Variables** → adicione
  `JWT_SECRET` com esse valor, pra todos os ambientes (Production, Preview,
  Development).

## 5. Redeploy
- Depois de mexer nas Environment Variables, faça um novo deploy (Vercel →
  aba Deployments → ⋯ → Redeploy), ou apenas dê um novo `git push`.

## Testar no seu computador (opcional)
Como o app agora tem funções de servidor (pasta `api/`), rodar só `npm run
dev` não é suficiente para testar login/cadastro localmente — o Vite não
executa essas funções. Use o próprio CLI da Vercel:

```
npm install -g vercel
vercel link          # uma vez, conecta esta pasta ao projeto na Vercel
vercel env pull .env.local
vercel dev
```

Isso roda o front-end e as funções de `api/` juntos, exatamente como em
produção.

## Atualizações futuras
Sempre que quiser publicar uma nova versão, basta dar `git push` — a Vercel
faz o deploy sozinha.
