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
from typing import Optional

# --- Environment Variables ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

# --- Initialize Clients ---
if not all([SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY]):
    # In a serverless environment, we can't hard-fail on import.
    # We'll check for the clients in the endpoints instead.
    supabase = None
    openai = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    openai = OpenAI(api_key=OPENAI_API_KEY)

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


# --- API Endpoints ---
@app.get("/")
async def root():
    return {"status": "ok", "message": "LaTeX AI Writer v2 Backend API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/optimize-resume")
async def optimize_resume(req: Request, body: OptimizeResumeRequest):
    if not supabase or not openai:
        raise HTTPException(status_code=500, detail="Server is not configured. Missing Supabase or OpenAI credentials.")
        
    try:
        # 1. Get user from JWT
        auth_header = req.headers.get('authorization')
        if not auth_header:
            raise HTTPException(status_code=401, detail="Missing Authorization header")
        
        token = auth_header.replace("Bearer ", "")
        try:
            user_response = supabase.auth.get_user(token)
            user = user_response.user
        except Exception as e:
            # Supabase-py throws a generic exception on invalid token
            raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

        if not user:
            raise HTTPException(status_code=401, detail="User not found for the provided token.")

        # 2. Fetch data from Supabase
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

        # 3. Build AI prompt
        ai_prompt = f'{custom_prompt}\n\nRESUME:\n{resume['latex_content']}\n\nJOB DESCRIPTION:\nTitle: {jd['title']}\nCompany: {jd.get('company', 'Not specified')}\nDescription: {jd['description']}\n\nOUTPUT FORMAT:\nReturn a JSON object with these fields:\n- optimized_latex: The complete optimized LaTeX resume\n- suggestions: A detailed explanation of changes made\n- ats_score: A number between 0-100 representing ATS compatibility'

        # 4. Call OpenAI
        ai_response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert ATS resume optimizer. Always respond with valid JSON."},
                {"role": "user", "content": ai_prompt},
            ],
            response_format={"type": "json_object"},
        )
        ai_content = json.loads(ai_response.choices[0].message.content or '{}')

        # 5. Save optimization
        optimization_data = {
            "user_id": user.id,
            "job_description_id": body.jobDescriptionId,
            "resume_id": resume['id'],
            "optimized_latex": ai_content.get("optimized_latex"),
            "suggestions": ai_content.get("suggestions"),
            "ats_score": ai_content.get("ats_score"),
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