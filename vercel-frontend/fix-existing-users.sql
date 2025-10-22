-- Fix for existing users who don't have profiles
-- Run this script in your Supabase SQL Editor after running the main setup script

-- Create profiles for existing users who don't have them
INSERT INTO public.profiles (id, email, full_name)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', '')
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Create default user settings for existing users who don't have them
INSERT INTO public.user_settings (user_id, ai_prompt)
SELECT 
    au.id,
    'You are an expert ATS (Applicant Tracking System) resume optimizer. 

Given the following LaTeX resume and job description, optimize the resume to maximize ATS compatibility while maintaining authenticity.

INSTRUCTIONS:
1. Identify key keywords and phrases from the job description
2. Modify the LaTeX resume to incorporate these keywords naturally
3. Adjust bullet points to align with job requirements
4. Maintain LaTeX formatting integrity
5. Keep the changes truthful - don''t fabricate experience
6. Provide an ATS compatibility score (0-100)
7. Include specific suggestions for improvement'
FROM auth.users au
LEFT JOIN public.user_settings us ON au.id = us.user_id
WHERE us.user_id IS NULL;

-- Verify the fix worked
SELECT 
    'Users in auth.users' as table_name,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
    'Profiles created' as table_name,
    COUNT(*) as count
FROM public.profiles
UNION ALL
SELECT 
    'User settings created' as table_name,
    COUNT(*) as count
FROM public.user_settings;
