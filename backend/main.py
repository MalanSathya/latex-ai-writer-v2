import os
import json
import base64
import subprocess
import tempfile
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from openai import OpenAI
import google.generativeai as genai
from typing import Optional

# --- Environment Variables ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# --- FastAPI App ---
app = FastAPI(root_path="/api")

# --- CORS Configuration ---
allowed_origins = [
    "https://latex-ai-writer-v2-frontend.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class LatexRequest(BaseModel):
    latex_content: str

class OptimizeResumeRequest(BaseModel):
    jobDescriptionId: str

class GenerateCoverLetterRequest(BaseModel):
    jobDescriptionId: str

# --- Default Prompts ---
DEFAULT_AI_PROMPT = """CAREERMAX v3.0 - ATS Resume Optimizer
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

PRINCIPLE: Every word adds strategic value. No fluff, no fabrication, maximum impact."""

DEFAULT_COVER_LETTER_PROMPT = """CAREERMAX v3.0 - ATS Cover Letter Generator
CORE MISSION: Craft a highly personalized and impactful cover letter aligned to a specific job description.
PRIMARY DIRECTIVES

LOCK TARGET: Extract exact role/company from user request.
ZERO FABRICATION: Use only stated/inferable data from user's resume/profile. Query ambiguities.
QUANTIFY IMPACT: Convert achievements to metrics (scale, %, $, time) where credible.
ALIGN: Explicitly match user's experience and skills to JD requirements.
CUSTOMIZE: Address specific company values or projects mentioned in JD if user's profile supports it.
DELIVER FIRST: Generate complete document immediately, insights after.

CONTENT RULES

Verify: Confirm all skills/metrics/experience exist in provided data.
Attribute: Distinguish direct contributions from team metrics.
Impact: Every point should demonstrate measurable value or relevant technical depth related to the JD.
Professional: Maintain formal, concise and compelling tone.
Scannable: Clear structure, strong opening and closing, industry terminology only.

COVER LETTER STRUCTURE

Your Contact Info with Date
Hiring Manager Contact Info (if available, otherwise "Hiring Team")
Salutation (e.g., Dear [Mr./Ms./Mx. Last Name] or Dear Hiring Team,)
Paragraph 1: Express enthusiasm, state role applying for, and briefly mention key qualification (1-2 sentences).
Paragraph 2-3: Highlight 2-3 key experiences/achievements that directly align with JD requirements, using quantifiable impacts.
Paragraph 4: Express eagerness to learn more, reiterate fit, and call to action (e.g., "I look forward to discussing my application further.").
Closing (e.g., Sincerely,)
Your Name

EXECUTION PROTOCOL

Extract target from JD.
Identify JD keywords/phrases.
Generate optimized LaTeX cover letter:

Incorporate keywords naturally.
Align content with JD requirements.
Maintain LaTeX integrity for formatting.
Keep truthful - no fabrication.
Ensure strong narrative flow from resume.

Provide ATS score (0-100) + improvement suggestions for the generated cover letter.

PRINCIPLE: Every word adds strategic value. No fluff, no fabrication, maximum impact. Highly relevant, concise, and compelling."""

def get_clients(user_id: Optional[str] = None):
    try:
        if not all([SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY]):
            raise ValueError("Supabase environment variables are missing.")
        supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        api_key_to_use = OPENAI_API_KEY
        gemini_api_key_to_use = GEMINI_API_KEY
        if user_id:
            settings_res = supabase_client.from_("user_settings").select("openai_api_key, gemini_api_key").eq("user_id", user_id).maybe_single().execute()
            if settings_res.data:
                if settings_res.data.get("openai_api_key"):
                    api_key_to_use = settings_res.data["openai_api_key"]
                if settings_res.data.get("gemini_api_key"):
                    gemini_api_key_to_use = settings_res.data["gemini_api_key"]

        openai_client = None
        if api_key_to_use:
            openai_client = OpenAI(api_key=api_key_to_use)

        if gemini_api_key_to_use:
            genai.configure(api_key=gemini_api_key_to_use)

        return supabase_client, openai_client
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize clients. Check environment variables. Error: {e}")

async def generate_with_gemini(prompt: str):
    if not GEMINI_API_KEY:
        return None
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(
            'gemini-pro',
            generation_config={"response_mime_type": "application/json"}
        )
        response = await model.generate_content_async(prompt)
        return response.parts[0].text
    except Exception as e:
        print(f"An unexpected error occurred with Gemini: {e}")
        return None

# --- API Endpoints ---
@app.get("/")
async def root():
    return {"status": "ok", "message": "Backend is running with lazy initialization."}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/optimize-resume")
async def optimize_resume(req: Request, body: OptimizeResumeRequest):
    try:
        auth_header = req.headers.get('authorization')
        if not auth_header:
            raise HTTPException(status_code=401, detail="Missing Authorization header")
        token = auth_header.replace("Bearer ", "")
        supabase, _ = get_clients()
        user_response = supabase.auth.get_user(token)
        user = user_response.user
        if not user:
            raise HTTPException(status_code=401, detail="User not found for the provided token.")

        supabase, openai = get_clients(user.id)

        settings_res = supabase.from_("user_settings").select("ai_prompt").eq("user_id", user.id).maybe_single().execute()
        custom_prompt = settings_res.data.get("ai_prompt") if settings_res.data and settings_res.data.get("ai_prompt") else DEFAULT_AI_PROMPT

        jd_res = supabase.from_("job_descriptions").select("*").eq("id", body.jobDescriptionId).single().execute()
        if not jd_res.data:
            raise HTTPException(status_code=404, detail=f"Job description with ID {body.jobDescriptionId} not found.")
        jd = jd_res.data

        resume_res = supabase.from_("resumes").select("*").eq("user_id", user.id).eq("is_current", True).single().execute()
        if not resume_res.data:
            raise HTTPException(status_code=404, detail="Current resume for the user not found.")
        resume = resume_res.data

        job_description_text = jd['description']
        resume_latex_content = resume['latex_content']

        ai_prompt_full = f"""
{custom_prompt}

## **JOB DESCRIPTION:**

{job_description_text}

## **CURRENT RESUME (in LaTeX):**

{resume_latex_content}

Please provide your optimization and suggestions based _only_ on the job description and resume provided above.
"""

        ai_content = None
        try:
            if not openai:
                raise Exception("OpenAI client not available.")
            ai_response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert ATS resume optimizer. Always respond with valid JSON."},
                    {"role": "user", "content": ai_prompt_full},
                ],
                response_format={"type": "json_object"},
            )
            ai_content = json.loads(ai_response.choices[0].message.content or '{}')
        except Exception as e:
            if "insufficient_quota" in str(e):
                gemini_response = await generate_with_gemini(ai_prompt_full)
                if gemini_response:
                    ai_content = json.loads(gemini_response)
                    ai_content["fallback_model"] = "gemini"
                else:
                    raise HTTPException(status_code=500, detail="OpenAI quota exceeded and fallback to Gemini failed.")
            else:
                raise e

        optimization_data = {
            "user_id": user.id,
            "job_description_id": body.jobDescriptionId,
            "resume_id": resume['id'],
            "optimized_latex": ai_content.get("optimized_latex"),
            "suggestions": ai_content.get("suggestions"),
            "ats_score": ai_content.get("ats_score"),
            "fallback_model": ai_content.get("fallback_model")
        }
        optimization_res = supabase.from_("optimizations").insert(optimization_data).select("*").single().execute()

        if not optimization_res.data:
             raise HTTPException(status_code=500, detail=f"Failed to save optimization. Supabase response: {optimization_res.error}")

        return optimization_res.data

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"An unexpected error occurred in optimize-resume: {e}")
        raise HTTPException(status_code=500, detail=f"An unexpected server error occurred: {str(e)}")


@app.post("/generate-cover-letter")
async def generate_cover_letter(req: Request, body: GenerateCoverLetterRequest):
    try:
        auth_header = req.headers.get('authorization')
        if not auth_header:
            raise HTTPException(status_code=401, detail="Missing Authorization header")
        token = auth_header.replace("Bearer ", "")
        supabase, _ = get_clients()
        user_response = supabase.auth.get_user(token)
        user = user_response.user
        if not user:
            raise HTTPException(status_code=401, detail="User not found for the provided token.")

        supabase, openai = get_clients(user.id)

        settings_res = supabase.from_("user_settings").select("ai_prompt").eq("user_id", user.id).maybe_single().execute()
        custom_prompt = settings_res.data.get("ai_prompt") if settings_res.data and settings_res.data.get("ai_prompt") else DEFAULT_COVER_LETTER_PROMPT

        jd_res = supabase.from_("job_descriptions").select("*").eq("id", body.jobDescriptionId).single().execute()
        if not jd_res.data:
            raise HTTPException(status_code=404, detail=f"Job description with ID {body.jobDescriptionId} not found.")
        jd = jd_res.data

        cover_letter_res = supabase.from_("cover_letters").select("*").eq("user_id", user.id).eq("is_current", True).single().execute()
        if not cover_letter_res.data:
            raise HTTPException(status_code=404, detail="Current cover letter for the user not found.")
        cover_letter = cover_letter_res.data

        job_description_text = jd['description']
        cover_letter_latex_content = cover_letter['latex_content']

        ai_prompt_full = f"""
{custom_prompt}

## **JOB DESCRIPTION:**

{job_description_text}

## **CURRENT COVER LETTER (in LaTeX):**

{cover_letter_latex_content}

Please provide your optimization and suggestions based _only_ on the job description and cover letter provided above.
"""

        ai_content = None
        try:
            if not openai:
                raise Exception("OpenAI client not available.")
            ai_response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert ATS cover letter writer. Always respond with valid JSON."},
                    {"role": "user", "content": ai_prompt_full},
                ],
                response_format={"type": "json_object"},
            )
            ai_content = json.loads(ai_response.choices[0].message.content or '{}')
        except Exception as e:
            if "insufficient_quota" in str(e):
                gemini_response = await generate_with_gemini(ai_prompt_full)
                if gemini_response:
                    ai_content = json.loads(gemini_response)
                    ai_content["fallback_model"] = "gemini"
                else:
                    raise HTTPException(status_code=500, detail="OpenAI quota exceeded and fallback to Gemini failed.")
            else:
                raise e

        cover_letter_gen_data = {
            "user_id": user.id,
            "job_description_id": body.jobDescriptionId,
            "cover_letter_id": cover_letter['id'],
            "optimized_latex": ai_content.get("optimized_latex"),
            "suggestions": ai_content.get("suggestions"),
            "ats_score": ai_content.get("ats_score"),
            "fallback_model": ai_content.get("fallback_model")
        }
        cover_letter_gen_res = supabase.from_("cover_letter_generations").insert(cover_letter_gen_data).select("*").single().execute()

        if not cover_letter_gen_res.data:
             raise HTTPException(status_code=500, detail=f"Failed to save cover letter generation. Supabase response: {cover_letter_gen_res.error}")

        return cover_letter_gen_res.data

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"An unexpected error occurred in generate-cover-letter: {e}")
        raise HTTPException(status_code=500, detail=f"An unexpected server error occurred: {str(e)}")


@app.post("/generate-pdf")
async def generate_pdf(request: LatexRequest):
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            tex_file = os.path.join(tmpdir, "resume.tex")
            
            with open(tex_file, 'w', encoding='utf-8') as f:
                f.write(request.latex_content)
            
            result = subprocess.run(
                ['pdflatex', '-interaction=nonstopmode', 'resume.tex'],
                cwd=tmpdir,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode != 0:
                print("pdflatex stdout:", result.stdout)
                print("pdflatex stderr:", result.stderr)
                raise HTTPException(
                    status_code=500,
                    detail=f"LaTeX compilation failed: {result.stderr}"
                )
            
            pdf_file = os.path.join(tmpdir, "resume.pdf")
            
            if not os.path.exists(pdf_file):
                print("pdflatex stdout:", result.stdout)
                print("pdflatex stderr:", result.stderr)
                raise HTTPException(
                    status_code=500,
                    detail="PDF file not generated despite successful compilation."
                )
            
            with open(pdf_file, 'rb') as f:
                pdf_data = f.read()
            
            pdf_base64 = base64.b64encode(pdf_data).decode('utf-8')
            
            return {"pdf": pdf_base64}
            
    except subprocess.TimeoutExpired:
        raise HTTPException(
            status_code=408,
            detail="LaTeX compilation timed out"
        )
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        )