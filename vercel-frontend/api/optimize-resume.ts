import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*'); // Loosened for debugging
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // --- DEBUGGING: Return a dummy response to test if the proxy itself is working ---
  try {
    return res.status(200).json({
      message: "Proxy is working correctly.",
      received_body: req.body,
      python_backend_url: process.env.PYTHON_BACKEND_URL || "NOT SET"
    });
  } catch (e: any) {
    // This will catch any unexpected error during the response itself
    return res.status(500).json({ error: "Proxy crashed during response", details: e.message });
  }
}