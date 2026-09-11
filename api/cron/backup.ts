import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

// Chamado automaticamente 1x por dia pela Vercel (veja vercel.json).
// Salva uma cópia de cada cliente na tabela `backups` e apaga snapshots
// automáticos com mais de 30 dias, pra não crescer pra sempre.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Proteção: só a própria Vercel (com o CRON_SECRET) pode chamar essa rota.
  // Antes: se CRON_SECRET não estivesse definido, a checagem era pulada e a
  // rota ficava aberta. Agora: sem CRON_SECRET configurado, a rota recusa
  // sempre (fail-closed).
  if (!process.env.CRON_SECRET) {
    console.error('CRON_SECRET não configurado — recusando chamada por segurança.');
    res.status(500).json({ error: 'Rota não configurada corretamente.' });
    return;
  }
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Não autorizado.' });
    return;
  }

  try {
    const familias = await sql`SELECT id, nome_familia, dados FROM familias`;

    for (const f of familias.rows) {
      await sql`
        INSERT INTO backups (familia_id, nome_familia, dados, tipo)
        VALUES (${f.id}, ${f.nome_familia}, ${JSON.stringify(f.dados)}::jsonb, 'automatico')
      `;
    }

    await sql`
      DELETE FROM backups
      WHERE tipo = 'automatico' AND criado_em < now() - interval '30 days'
    `;

    res.status(200).json({ success: true, backupsFeitos: familias.rows.length });
  } catch (err) {
    console.error('Erro no backup automático:', err);
    res.status(500).json({ error: 'Erro ao rodar backup automático.' });
  }
}
