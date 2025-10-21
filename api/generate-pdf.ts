import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export default async function handler(req: any, res: any) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: req.headers.authorization! },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = req.body;
    const optimizationId = body.optimizationId;

    if (!optimizationId) {
      throw new Error('Missing optimizationId');
    }

    const { data: optimization, error: optError } = await supabase
      .from('optimizations')
      .select('*')
      .eq('id', optimizationId)
      .eq('user_id', user.id)
      .single();

    if (optError) throw optError;

    // Use latex-to-pdf.lovable.app service for PDF generation
    const apiKey = process.env.LATEX_API_KEY;
    if (!apiKey) {
      throw new Error('LATEX_API_KEY environment variable not set');
    }

    const pdfResponse = await fetch('https://latex-to-pdf.lovable.app/functions/v1/latex-convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        latex: optimization.optimized_latex,
      }),
    });

    if (!pdfResponse.ok) {
      const errorBody = await pdfResponse.json();
      throw new Error(`Failed to compile LaTeX: ${errorBody.error}`);
    }

    const result = await pdfResponse.json();
    if (result.error) {
      throw new Error(`LaTeX compilation failed: ${result.error}`);
    }
    
    const pdfBase64 = result.pdfUrl.replace(/^data:application\/pdf;base64,/, '');

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
    return res.status(200).json({ pdf: pdfBase64 });
  } catch (error) {
    console.error('Error in generate-pdf:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: errorMessage });
  }
}
