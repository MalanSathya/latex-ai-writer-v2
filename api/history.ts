import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get auth user
    const authHeader = req.headers.authorization!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch optimization history
    const { data: optimizations, error: optError } = await supabase
      .from('optimizations')
      .select(`
        *,
        job_descriptions (
          title,
          company,
          description
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (optError) throw optError;

    // Fetch cover letter generation history
    const { data: coverLetterGens, error: clError } = await supabase
      .from('cover_letter_generations')
      .select(`
        *,
        job_descriptions (
          title,
          company,
          description
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (clError) throw clError;

    // Combine and sort all history
    const history = [
      ...optimizations.map(opt => ({
        id: opt.id,
        type: 'resume_optimization',
        job_description: opt.job_descriptions,
        created_at: opt.created_at,
        ats_score: opt.ats_score,
        suggestions: opt.suggestions
      })),
      ...coverLetterGens.map(cl => ({
        id: cl.id,
        type: 'cover_letter_generation',
        job_description: cl.job_descriptions,
        created_at: cl.created_at,
        ats_score: cl.ats_score,
        suggestions: cl.suggestions
      }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
    return res.status(200).json({ history });
  } catch (error) {
    console.error('Error in history:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: errorMessage });
  }
}
