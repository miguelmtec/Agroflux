import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader(
    'Set-Cookie',
    'session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure'
  );
  res.status(200).json({ success: true });
}
