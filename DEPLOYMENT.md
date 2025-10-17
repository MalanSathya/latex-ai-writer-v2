# Vercel Deployment Guide

This guide will help you deploy the LaTeX AI Writer v2 project to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **OpenAI API Key**: Get your API key from [OpenAI](https://platform.openai.com/api-keys)
4. **Supabase Project**: Set up your Supabase project and get the credentials
5. **Database Setup**: Run the database setup script in Supabase

## Environment Variables

You need to set up the following environment variables in Vercel:

### Required Environment Variables

1. **OPENAI_API_KEY**
   - Your OpenAI API key for AI-powered resume optimization
   - Get it from: https://platform.openai.com/api-keys

2. **SUPABASE_URL**
   - Your Supabase project URL
   - Found in: Supabase Dashboard > Settings > API

3. **SUPABASE_ANON_KEY**
   - Your Supabase anonymous key
   - Found in: Supabase Dashboard > Settings > API

4. **SUPABASE_SERVICE_ROLE_KEY**
   - Your Supabase service role key (keep this secret!)
   - Found in: Supabase Dashboard > Settings > API

## Database Setup

**IMPORTANT**: Before deploying, you must set up your Supabase database.

1. **Go to your Supabase Dashboard**:
   - Navigate to [supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Open SQL Editor**:
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Database Setup Script**:
   - Copy the contents of `supabase-setup.sql` from this repository
   - Paste it into the SQL Editor
   - Click "Run" to execute the script

4. **Verify Tables Created**:
   - Go to "Table Editor" in the left sidebar
   - You should see these tables:
     - `profiles`
     - `resumes`
     - `cover_letters`
     - `job_descriptions`
     - `optimizations`
     - `cover_letter_generations`
     - `user_settings`

## Deployment Steps

### Step 1: Prepare Your Repository

1. Make sure all your code is committed and pushed to GitHub
2. Ensure you have the following files in your repository:
   - `vercel.json` (root level)
   - `package.json` (root level)
   - `api/` directory with your API endpoints
   - `frontend/` directory with your React app

### Step 2: Deploy to Vercel

1. **Import Project**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Build Settings**:
   - Vercel should automatically detect the project structure
   - The `vercel.json` file will handle the configuration

3. **Set Environment Variables**:
   - In the Vercel dashboard, go to your project
   - Navigate to Settings > Environment Variables
   - Add each environment variable:
     - `OPENAI_API_KEY`: Your OpenAI API key
     - `SUPABASE_URL`: Your Supabase project URL (for backend)
     - `SUPABASE_ANON_KEY`: Your Supabase anonymous key (for backend)
     - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
     - `VITE_SUPABASE_URL`: Your Supabase project URL (for frontend)
     - `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase anonymous key (for frontend)

4. **Deploy**:
   - Click "Deploy" to start the deployment process
   - Wait for the build to complete

### Step 3: Verify Deployment

1. **Check API Endpoints**:
   - Test your API endpoints at `https://your-app.vercel.app/api/`
   - Available endpoints:
     - `/api/optimize-resume`
     - `/api/generate-cover-letter`
     - `/api/generate-pdf`
     - `/api/history`

2. **Test Frontend**:
   - Visit your deployed app URL
   - Test the authentication flow
   - Test resume optimization functionality

## Project Structure

```
latex-ai-writer-v2/
├── api/                          # Vercel API routes
│   ├── optimize-resume.ts        # Resume optimization endpoint
│   ├── generate-cover-letter.ts  # Cover letter generation endpoint
│   ├── generate-pdf.ts          # PDF generation endpoint
│   └── history.ts               # History retrieval endpoint
├── frontend/                     # React frontend
│   ├── src/                     # Source code
│   ├── package.json             # Frontend dependencies
│   └── vite.config.ts           # Vite configuration
├── vercel.json                  # Vercel configuration
├── package.json                 # Root package.json
└── env.example                  # Environment variables template
```

## API Endpoints

### POST /api/optimize-resume
Optimizes a resume based on a job description using AI.

**Request Body**:
```json
{
  "jobDescriptionId": "uuid"
}
```

**Response**:
```json
{
  "id": "uuid",
  "optimized_latex": "LaTeX content",
  "suggestions": "Optimization suggestions",
  "ats_score": 85
}
```

### POST /api/generate-cover-letter
Generates a cover letter based on a job description using AI.

**Request Body**:
```json
{
  "jobDescriptionId": "uuid"
}
```

### POST /api/generate-pdf
Converts LaTeX content to PDF.

**Request Body**:
```json
{
  "optimizationId": "uuid"
}
```

### GET /api/history
Retrieves optimization and generation history.

**Response**:
```json
{
  "history": [
    {
      "id": "uuid",
      "type": "resume_optimization",
      "job_description": {...},
      "created_at": "timestamp",
      "ats_score": 85
    }
  ]
}
```

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check that all dependencies are properly installed
   - Verify the `package.json` files are correct
   - Check the Vercel build logs for specific errors

2. **API Errors**:
   - Verify all environment variables are set correctly
   - Check the API logs in Vercel dashboard
   - Ensure Supabase credentials are valid

3. **Frontend Issues**:
   - Check browser console for errors
   - Verify API endpoints are accessible
   - Check network requests in browser dev tools

### Environment Variables Not Working

1. Make sure environment variables are set in Vercel dashboard
2. Redeploy after adding new environment variables
3. Check variable names match exactly (case-sensitive)

### Supabase Connection Issues

1. Verify your Supabase URL and keys are correct
2. Check Supabase project is active and not paused
3. Ensure RLS policies allow your operations

## Cost Optimization

### Vercel Free Tier Limits
- 100GB bandwidth per month
- 100 serverless function executions per day
- 1,000 build minutes per month

### OpenAI API Costs
- Monitor usage in OpenAI dashboard
- Consider using `gpt-4o-mini` for cost efficiency
- Implement rate limiting if needed

### Supabase Free Tier
- 500MB database storage
- 2GB bandwidth per month
- 50,000 monthly active users

## Security Considerations

1. **Environment Variables**: Never commit API keys to version control
2. **Supabase RLS**: Implement proper Row Level Security policies
3. **API Rate Limiting**: Consider implementing rate limiting for production
4. **CORS**: Configure CORS properly for your domain

## Monitoring

1. **Vercel Analytics**: Enable Vercel Analytics for usage insights
2. **Error Tracking**: Monitor function logs in Vercel dashboard
3. **Performance**: Use Vercel Speed Insights for performance monitoring

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review Supabase logs
3. Test API endpoints individually
4. Check browser console for frontend errors

For additional help, refer to:
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
