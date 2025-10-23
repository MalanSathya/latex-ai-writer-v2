import type { VercelRequest, VercelResponse } from '@vercel/node';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Respond to preflight
  if (req.method === 'OPTIONS') {
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_FUNCTIONS_URL;
    const supabaseKey = process.env.SUPABASE_API_KEY;

    if (!supabaseUrl || !supabaseKey) {
      Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
      return res.status(500).json({ error: 'Supabase configuration missing on server' });
    }

    // Forward Authorization header (user JWT) if present
    const authHeader = req.headers.authorization as string | undefined;

    // Compose target URL
    const functionUrl = supabaseUrl.replace(/\/+$/, '') + '/optimize-resume';

    // Forward request to Supabase function
    const forwardResp = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(req.body ?? {}),
    });

    const text = await forwardResp.text();
    let payload: any = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = text;
    }

    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(forwardResp.status).json(payload);
  } catch (err: any) {
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
    console.error('Proxy error (no tokens logged):', err?.message || err);
    return res.status(502).json({ error: 'Proxy error', details: String(err?.message || err) });
  }
}
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('API Route called:', req.method, req.url);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const openaiApiKey = process.env.OPENAI_API_KEY!;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const openai = new OpenAI({ apiKey: openaiApiKey });
    

    // Get auth user
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { jobDescriptionId } = req.body;
    if (!jobDescriptionId) {
      return res.status(400).json({ error: 'Missing jobDescriptionId' });
    }

    // Fetch user settings for custom AI prompt
    const { data: settings } = await supabase
      .from('user_settings')
      .select('ai_prompt')
      .eq('user_id', user.id)
      .maybeSingle();

    const customPrompt = settings?.ai_prompt || `CAREERMAX v3.0 - ATS Resume Optimizer
CORE MISSION: Generate high-impact career docs aligned to target role.
PRIMARY DIRECTIVES

LOCK TARGET: Extract exact role/company from user request
ZERO FABRICATION: Use only stated/inferable data. Query ambiguities
QUANTIFY: Convert achievements to metrics (scale, %, $, time)
EXTRACT VALUE: Probe for leadership, mentorship, process improvements, business impact
DELIVER FIRST: Generate complete document immediately, insights after

CONTENT RULES

Verify: Confirm all skills/metrics/experience exist in provided data
Attribute: Distinguish direct contributions from team metrics
Impact: Every bullet demonstrates measurable value/technical depth
Scannable: High density, clear structure, industry terminology only

RESUME STRUCTURE
Contact → Summary (2-3 impact lines) → Technical Skills (categorized) → Experience (role-tagged sub-bullets) → Projects → Education
EXECUTION PROTOCOL

Extract target from JD
Identify JD keywords/phrases
Generate optimized LaTeX resume:

Incorporate keywords naturally
Align bullets with JD requirements
Maintain LaTeX integrity
Keep truthful - no fabrication

Generate LaTeX cover letter in specified format
Provide ATS score (0-100) + improvement suggestions

PRINCIPLE: Every word adds strategic value. No fluff, no fabrication, maximum impact.`;

    // Fetch job description
    const { data: jd, error: jdError } = await supabase
      .from('job_descriptions')
      .select('*')
      .eq('id', jobDescriptionId)
      .single();

    if (jdError) throw jdError;

    // Fetch current resume
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_current', true)
      .single();

    if (resumeError) throw resumeError;

    // Build AI prompt
    const aiPrompt = `${customPrompt}

RESUME:
${resume.latex_content}

JOB DESCRIPTION:
Title: ${jd.title}
Company: ${jd.company || 'Not specified'}
Description: ${jd.description}

OUTPUT FORMAT:
Return a JSON object with these fields:
- optimized_latex: The complete optimized LaTeX resume
- suggestions: A detailed explanation of changes made
- ats_score: A number between 0-100 representing ATS compatibility`;

    // ✅ OpenAI SDK call
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', 
      messages: [
        { role: 'system', content: 'You are an expert ATS resume optimizer. Always respond with valid JSON.' },
        { role: 'user', content: aiPrompt },
      ],
      response_format: { type: 'json_object' },
    });

    const aiContent = JSON.parse(aiResponse.choices[0].message.content || '{}');

    // Save optimization
    const { data: optimization, error: optError } = await supabase
      .from('optimizations')
      .insert({
        user_id: user.id,
        job_description_id: jobDescriptionId,
        resume_id: resume.id,
        optimized_latex: aiContent.optimized_latex,
        suggestions: aiContent.suggestions,
        ats_score: aiContent.ats_score,
      })
      .select()
      .single();

    if (optError) throw optError;

    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(200).json(optimization);
  } catch (error) {
    console.error('Error in optimize-resume:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available';
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(500).json({
      error: 'An unexpected error occurred during resume optimization.',
      details: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
      route: 'optimize-resume',
    });
  }
}