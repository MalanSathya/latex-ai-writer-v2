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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const openaiApiKey = process.env.OPENAI_API_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get auth user
    const authHeader = req.headers.authorization!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { jobDescriptionId } = req.body;

    // Fetch user settings for custom AI prompt
    const { data: settings } = await supabase
      .from('user_settings')
      .select('ai_prompt')
      .eq('user_id', user.id)
      .maybeSingle();

    const customPrompt = settings?.ai_prompt || `You are an expert ATS (Applicant Tracking System) cover letter optimizer. 

Given the following LaTeX cover letter template and job description, generate a personalized cover letter that maximizes ATS compatibility while maintaining authenticity.

INSTRUCTIONS:
1. Identify key keywords and phrases from the job description
2. Customize the cover letter to incorporate these keywords naturally
3. Align the content with job requirements and company values
4. Maintain LaTeX formatting integrity
5. Keep the content truthful and professional
6. Provide an ATS compatibility score (0-100)
7. Include specific suggestions for improvement`;

    // Fetch job description
    const { data: jd, error: jdError } = await supabase
      .from('job_descriptions')
      .select('*')
      .eq('id', jobDescriptionId)
      .single();

    if (jdError) throw jdError;

    // Fetch current cover letter template
    const { data: coverLetter, error: coverLetterError } = await supabase
      .from('cover_letters')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_current', true)
      .single();

    if (coverLetterError) throw coverLetterError;

    // Build AI prompt using custom prompt
    const aiPrompt = `${customPrompt}

COVER LETTER TEMPLATE:
${coverLetter.latex_content}

JOB DESCRIPTION:
Title: ${jd.title}
Company: ${jd.company || 'Not specified'}
Description: ${jd.description}

OUTPUT FORMAT:
Return a JSON object with these fields:
- optimized_latex: The complete optimized LaTeX cover letter
- suggestions: A detailed explanation of changes made
- ats_score: A number between 0-100 representing ATS compatibility`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert ATS cover letter optimizer. Always respond with valid JSON.' },
          { role: 'user', content: aiPrompt }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error('Failed to generate cover letter with AI');
    }

    const aiData = await aiResponse.json();
    const aiContent = JSON.parse(aiData.choices[0].message.content);

    // Save cover letter generation
    const { data: coverLetterGen, error: genError } = await supabase
      .from('cover_letter_generations')
      .insert({
        user_id: user.id,
        job_description_id: jobDescriptionId,
        cover_letter_id: coverLetter.id,
        optimized_latex: aiContent.optimized_latex,
        suggestions: aiContent.suggestions,
        ats_score: aiContent.ats_score,
      })
      .select()
      .single();

    if (genError) throw genError;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
    return res.status(200).json(coverLetterGen);
  } catch (error) {
    console.error('Error in generate-cover-letter:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: errorMessage });
  }
}
