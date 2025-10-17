# LaTeX AI Writer v2

An AI-powered resume and cover letter generator that optimizes LaTeX documents for ATS (Applicant Tracking System) compatibility.

## Features

### Core Features
- **Job Description Input**: Upload or paste job descriptions
- **Resume Management**: Upload your LaTeX resume template
- **AI-Powered Optimization**: Uses OpenAI API to tailor resumes for ATS optimization
- **Cover Letter Generation**: Generates personalized cover letters from LaTeX templates
- **PDF Conversion**: Converts LaTeX to PDF for download
- **History Tracking**: Saves all generations with timestamps in Supabase
- **Custom AI Prompts**: Configure your own AI optimization prompts

### Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Vercel API Routes (Node.js)
- **Database**: Supabase (PostgreSQL)
- **AI Integration**: OpenAI API (GPT-4o-mini)
- **PDF Generation**: LaTeX Online service
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- OpenAI API key
- Supabase project

### Local Development

1. **Clone the repository**:
```bash
git clone <YOUR_GIT_URL>
cd latex-ai-writer-v2
```

2. **Install dependencies**:
```bash
npm run install-deps
```

3. **Set up environment variables**:
```bash
cp env.example .env.local
# Edit .env.local with your actual values
```

4. **Start development server**:
```bash
npm run dev
```

### Environment Variables

Create a `.env.local` file with:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration (Backend)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Supabase Configuration (Frontend - Vite)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

## Deployment

### Vercel Deployment

This project is configured for easy deployment on Vercel. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

**Quick Deploy**:
1. Push your code to GitHub
2. Import project in Vercel dashboard
3. Set environment variables in Vercel
4. Deploy!

### API Endpoints

- `POST /api/optimize-resume` - Optimize resume for job description
- `POST /api/generate-cover-letter` - Generate cover letter
- `POST /api/generate-pdf` - Convert LaTeX to PDF
- `GET /api/history` - Get optimization history

## Project Structure

```
latex-ai-writer-v2/
├── api/                          # Vercel API routes
│   ├── optimize-resume.ts        # Resume optimization
│   ├── generate-cover-letter.ts  # Cover letter generation
│   ├── generate-pdf.ts          # PDF generation
│   └── history.ts               # History retrieval
├── frontend/                     # React frontend
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/              # Page components
│   │   ├── contexts/           # React contexts
│   │   └── integrations/       # Supabase integration
│   ├── package.json
│   └── vite.config.ts
├── supabase/                     # Supabase functions (legacy)
├── vercel.json                  # Vercel configuration
├── package.json                 # Root dependencies
└── DEPLOYMENT.md               # Deployment guide
```

## Usage

1. **Upload Resume**: Upload your LaTeX resume template
2. **Upload Cover Letter**: Upload your LaTeX cover letter template
3. **Add Job Description**: Paste or upload a job description
4. **Optimize**: Click optimize to generate ATS-optimized versions
5. **Download**: Download the optimized PDFs
6. **History**: View all previous optimizations

## Cost Optimization

- Uses `gpt-4o-mini` for cost-effective AI processing
- Leverages free tiers of Vercel, Supabase, and LaTeX Online
- Optimized for single-user usage

## Security

- Environment variables for API keys
- Supabase Row Level Security (RLS)
- CORS configuration
- Authentication required for all operations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the [DEPLOYMENT.md](./DEPLOYMENT.md) guide
2. Review Vercel and Supabase documentation
3. Check the issues section of this repository
