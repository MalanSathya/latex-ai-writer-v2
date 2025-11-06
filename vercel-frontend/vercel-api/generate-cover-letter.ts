import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://latex-ai-writer-v2-frontend.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173', // Vite default
  ];

  const corsOrigin = (origin && allowedOrigins.includes(origin)) 
    ? origin 
    : 'https://latex-ai-writer-v2-frontend.vercel.app';

  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL;

    if (!pythonBackendUrl) {
      return res.status(500).json({ error: 'Python backend URL is not configured on the server.' });
    }

    const authHeader = req.headers.authorization;
    const targetUrl = `${pythonBackendUrl}/api/generate-cover-letter`;

    const forwardResp = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(req.body ?? {}),
    });

    const responseText = await forwardResp.text();
    let payload: any = null;
    try {
      payload = responseText ? JSON.parse(responseText) : null;
    } catch {
      payload = responseText;
    }

    return res.status(forwardResp.status).json(payload);

  } catch (err: any) {
    console.error('Proxy error:', err?.message || err);
    return res.status(502).json({ error: 'Proxy error', details: String(err?.message || err) });
  }
}