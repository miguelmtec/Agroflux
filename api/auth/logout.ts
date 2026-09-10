import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cookieLogout } from '../_lib/session';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Set-Cookie', cookieLogout);
  res.status(200).json({ success: true });
}
