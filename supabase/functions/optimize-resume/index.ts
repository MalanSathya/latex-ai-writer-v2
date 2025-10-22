import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
      },
    });
  }
  try {
    const { jobDescriptionId } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("User not found");

    // Fetch job description
    const { data: jobDescription, error: fetchError } = await supabase
      .from('job_descriptions')
      .select('*')
      .eq('id', jobDescriptionId)
      .single()
    
    if (fetchError) throw fetchError

    // Fetch current resume
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_current', true)
      .single()

    if (resumeError) throw new Error('Current resume not found.');
    if (!resume) throw new Error('Current resume not found.');


    // Your AI optimization logic here
    // This is a placeholder - implement your actual resume optimization
    const optimizedLatex = `\documentclass{article}
\begin{document}
% Optimized resume for ${jobDescription.title} at ${jobDescription.company}
\end{document}`

    // Save optimization result
    const { data: optimization, error: saveError } = await supabase
      .from('optimizations')
      .insert({
        user_id: user.id,
        job_description_id: jobDescriptionId,
        resume_id: resume.id,
        optimized_latex: optimizedLatex,
        ats_score: 85,
        suggestions: 'Sample optimization suggestions'
      })
      .select()
      .single()
    
    if (saveError) throw saveError

    return new Response(
      JSON.stringify(optimization),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
        }
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
        }
      }
    )
  }
})