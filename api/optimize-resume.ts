import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export default async function handler(req, res) {
  console.log('API Route called:', req.method, req.url);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    for (const [k, v] of Object.entries(corsHeaders)) res.setHeader(k, v);
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!supabaseUrl || !supabaseKey || !openaiApiKey) {
      throw new Error('Missing environment variables');
    }

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
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert ATS resume optimizer. Always respond with valid JSON.' },
        { role: 'user', content: aiPrompt },
      ],
      response_format: { type: 'json_object' },
    });

    let aiContent;
    try {
      aiContent = JSON.parse(aiResponse.choices[0].message.content || "{}");
    } catch (err) {
      console.error("Failed to parse AI content:", err, aiResponse);
      throw new Error("AI returned invalid JSON");
    }

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

    for (const [k, v] of Object.entries(corsHeaders)) res.setHeader(k, v);
    return res.status(200).json(optimization);
  } catch (error) {
    console.error('Error in optimize-resume:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    for (const [k, v] of Object.entries(corsHeaders)) res.setHeader(k, v);
    return res.status(500).json({
      error: errorMessage,
      timestamp: new Date().toISOString(),
      route: 'optimize-resume',
    });
  }
}




// import type { VercelRequest, VercelResponse } from '@vercel/node';
// import { createClient } from '@supabase/supabase-js';
// import OpenAI from 'openai';

// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
//   'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
// };

// export default async function handler(req: VercelRequest, res: VercelResponse) {
//   console.log('API Route called:', req.method, req.url);

//   // Handle CORS preflight
//   if (req.method === 'OPTIONS') {
//     Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
//     return res.status(200).end();
//   }

//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method not allowed' });
//   }

//   try {
//     const supabaseUrl = process.env.SUPABASE_URL!;
//     const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
//     const openaiApiKey = process.env.OPENAI_API_KEY!;

//     const supabase = createClient(supabaseUrl, supabaseKey);
//     const openai = new OpenAI({ apiKey: openaiApiKey });

//     // Get auth user
//     const authHeader = req.headers.authorization;
//     if (!authHeader) {
//       return res.status(401).json({ error: 'Missing Authorization header' });
//     }

//     const token = authHeader.replace('Bearer ', '');
//     const { data: { user }, error: authError } = await supabase.auth.getUser(token);

//     if (authError || !user) {
//       return res.status(401).json({ error: 'Unauthorized' });
//     }

//     const { jobDescriptionId } = req.body;
//     if (!jobDescriptionId) {
//       return res.status(400).json({ error: 'Missing jobDescriptionId' });
//     }

//     // Fetch user settings for custom AI prompt
//     const { data: settings } = await supabase
//       .from('user_settings')
//       .select('ai_prompt')
//       .eq('user_id', user.id)
//       .maybeSingle();

//     const customPrompt = settings?.ai_prompt || `CAREERMAX v3.0 - ATS Resume Optimizer
// CORE MISSION: Generate high-impact career docs aligned to target role.
// PRIMARY DIRECTIVES

// LOCK TARGET: Extract exact role/company from user request
// ZERO FABRICATION: Use only stated/inferable data. Query ambiguities
// QUANTIFY: Convert achievements to metrics (scale, %, $, time)
// EXTRACT VALUE: Probe for leadership, mentorship, process improvements, business impact
// DELIVER FIRST: Generate complete document immediately, insights after

// CONTENT RULES

// Verify: Confirm all skills/metrics/experience exist in provided data
// Attribute: Distinguish direct contributions from team metrics
// Impact: Every bullet demonstrates measurable value/technical depth
// Scannable: High density, clear structure, industry terminology only

// RESUME STRUCTURE
// Contact → Summary (2-3 impact lines) → Technical Skills (categorized) → Experience (role-tagged sub-bullets) → Projects → Education
// EXECUTION PROTOCOL

// Extract target from JD
// Identify JD keywords/phrases
// Generate optimized LaTeX resume:

// Incorporate keywords naturally
// Align bullets with JD requirements
// Maintain LaTeX integrity
// Keep truthful - no fabrication

// Generate LaTeX cover letter in specified format
// Provide ATS score (0-100) + improvement suggestions

// PRINCIPLE: Every word adds strategic value. No fluff, no fabrication, maximum impact.`;

//     // Fetch job description
//     const { data: jd, error: jdError } = await supabase
//       .from('job_descriptions')
//       .select('*')
//       .eq('id', jobDescriptionId)
//       .single();

//     if (jdError) throw jdError;

//     // Fetch current resume
//     const { data: resume, error: resumeError } = await supabase
//       .from('resumes')
//       .select('*')
//       .eq('user_id', user.id)
//       .eq('is_current', true)
//       .single();

//     if (resumeError) throw resumeError;

//     // Build AI prompt
//     const aiPrompt = `${customPrompt}

// RESUME:
// ${resume.latex_content}

// JOB DESCRIPTION:
// Title: ${jd.title}
// Company: ${jd.company || 'Not specified'}
// Description: ${jd.description}

// OUTPUT FORMAT:
// Return a JSON object with these fields:
// - optimized_latex: The complete optimized LaTeX resume
// - suggestions: A detailed explanation of changes made
// - ats_score: A number between 0-100 representing ATS compatibility`;

//     // ✅ OpenAI SDK call
//     const aiResponse = await openai.chat.completions.create({
//       model: 'gpt-4o-mini',
//       messages: [
//         { role: 'system', content: 'You are an expert ATS resume optimizer. Always respond with valid JSON.' },
//         { role: 'user', content: aiPrompt },
//       ],
//       response_format: { type: 'json_object' },
//     });

//     let aiContent;
//     try {
//       aiContent = JSON.parse(aiResponse.choices[0].message.content || "{}");
//     } catch (err) {
//       console.error("Failed to parse AI content:", err, aiResponse);
//       throw new Error("AI returned invalid JSON");
//     }

//     // Save optimization
//     const { data: optimization, error: optError } = await supabase
//       .from('optimizations')
//       .insert({
//         user_id: user.id,
//         job_description_id: jobDescriptionId,
//         resume_id: resume.id,
//         optimized_latex: aiContent.optimized_latex,
//         suggestions: aiContent.suggestions,
//         ats_score: aiContent.ats_score,
//       })
//       .select()
//       .single();

//     if (optError) throw optError;

//     Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
//     return res.status(200).json(optimization);
//   } catch (error) {
//     console.error('Error in optimize-resume:', error);
//     const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
//     Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
//     return res.status(500).json({
//       error: errorMessage,
//       timestamp: new Date().toISOString(),
//       route: 'optimize-resume',
//     });
//   }
// }