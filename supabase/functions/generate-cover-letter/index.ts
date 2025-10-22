import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

declare const Deno: any;

interface RequestBody {
  jobDescriptionId: string
}

interface SupabaseUser {
  id: string
  email?: string
  [key: string]: unknown
}

interface JobDescription {
  id: string
  title: string
  company?: string
  [key: string]: unknown
}

interface CoverLetterRecord {
  id: string
  user_id: string
  is_current: boolean
  [key: string]: unknown
}

interface CoverLetterGeneration {
  id?: string
  user_id: string
  job_description_id: string
  cover_letter_id: string
  optimized_latex: string
  ats_score: number
  suggestions: string
  [key: string]: unknown
}

serve(async (req: Request): Promise<Response> => {
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
    const { jobDescriptionId } = (await req.json()) as RequestBody

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = (await supabase.auth.getUser()) as {
      data: { user: SupabaseUser | null }
      error?: unknown
    }
    if (!user) throw new Error("User not found");

    // Fetch job description
    const { data: jobDescription, error: fetchError } = await supabase
      .from('job_descriptions')
      .select('*')
      .eq('id', jobDescriptionId)
      .single() as { data: JobDescription | null; error: unknown }
    
    if (fetchError) throw fetchError

    // Fetch current cover letter
    const { data: cover_letter, error: coverLetterError } = await supabase
      .from('cover_letters')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_current', true)
      .single() as { data: CoverLetterRecord | null; error: unknown }

    if (coverLetterError) throw new Error('Current cover letter not found.');
    if (!cover_letter) throw new Error('Current cover letter not found.');

    // Your AI cover letter generation logic here
    // This is a placeholder - implement your actual cover letter generation
    const coverLetterLatex: string = `\\documentclass{letter}
\\begin{document}
\\begin{letter}{${jobDescription?.company}}
Dear Hiring Manager,

I am writing to express my interest in the ${jobDescription?.title} position.

\\end{letter}
\\end{document}`

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
      .single() as { data: CoverLetterGeneration | null; error: unknown }
    
    if (saveError) throw saveError

    return new Response(
      JSON.stringify(coverLetter),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
        }
      }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message ?? String(error) }),
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