import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
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

    // Fetch current cover letter
    const { data: cover_letter, error: coverLetterError } = await supabase
      .from('cover_letters')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_current', true)
      .single()

    if (coverLetterError) throw new Error('Current cover letter not found.');
    if (!cover_letter) throw new Error('Current cover letter not found.');

    // Your AI cover letter generation logic here
    // This is a placeholder - implement your actual cover letter generation
    const coverLetterLatex = `\documentclass{letter}
\begin{document}
\begin{letter}{${jobDescription.company}}
Dear Hiring Manager,

I am writing to express my interest in the ${jobDescription.title} position.

\end{letter}
\end{document}`

    // Save cover letter
    const { data: coverLetter, error: saveError } = await supabase
      .from('cover_letter_generations')
      .insert({
        user_id: user.id,
        job_description_id: jobDescriptionId,
        cover_letter_id: cover_letter.id,
        optimized_latex: coverLetterLatex,
        ats_score: 90,
        suggestions: 'Sample cover letter suggestions'
      })
      .select()
      .single()
    
    if (saveError) throw saveError

    return new Response(
      JSON.stringify(coverLetter),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})