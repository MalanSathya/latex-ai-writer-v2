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
DEFAULT_AI_PROMPT = """CAREERMAX v3.0 - ATS Resume Optimizer..."""
DEFAULT_COVER_LETTER_PROMPT = """CAREERMAX v3.0 - ATS Cover Letter Generator..."""


# --- API Endpoints ---
@app.get("/")
async def root():
    # This endpoint now serves as a debug status check
    return {
        "status": "ok",
        "message": "LaTeX AI Writer v2 Backend API",
        "environment_check": {
            "SUPABASE_URL_SET": bool(SUPABASE_URL),
            "SUPABASE_SERVICE_ROLE_KEY_SET": bool(SUPABASE_SERVICE_ROLE_KEY),
            "OPENAI_API_KEY_SET": bool(OPENAI_API_KEY)
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

def get_clients():
    if not all([SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY]):
        raise HTTPException(status_code=500, detail="Server is not configured. One or more required environment variables are missing.")
    supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    openai_client = OpenAI(api_key=OPENAI_API_KEY)
    return supabase_client, openai_client

@app.post("/optimize-resume")
async def optimize_resume(req: Request, body: OptimizeResumeRequest):
    supabase, openai = get_clients()
    try:
        auth_header = req.headers.get('authorization')
        if not auth_header:
            raise HTTPException(status_code=401, detail="Missing Authorization header")
        token = auth_header.replace("Bearer ", "")
        user_response = supabase.auth.get_user(token)
        user = user_response.user
        if not user:
            raise HTTPException(status_code=401, detail="User not found for the provided token.")

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

        ai_prompt = f'{custom_prompt}...'

        ai_response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert ATS resume optimizer. Always respond with valid JSON."},
                {"role": "user", "content": ai_prompt},
            ],
            response_format={"type": "json_object"},
        )
        ai_content = json.loads(ai_response.choices[0].message.content or '{}')

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


@app.post("/generate-cover-letter")
async def generate_cover_letter(req: Request, body: GenerateCoverLetterRequest):
    supabase, openai = get_clients()
    try:
        auth_header = req.headers.get('authorization')
        if not auth_header:
            raise HTTPException(status_code=401, detail="Missing Authorization header")
        token = auth_header.replace("Bearer ", "")
        user_response = supabase.auth.get_user(token)
        user = user_response.user
        if not user:
            raise HTTPException(status_code=401, detail="User not found for the provided token.")

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

        ai_prompt = f'{custom_prompt}... '

        ai_response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert ATS cover letter writer. Always respond with valid JSON."},
                {"role": "user", "content": ai_prompt},
            ],
            response_format={"type": "json_object"},
        )
        ai_content = json.loads(ai_response.choices[0].message.content or '{}')

        cover_letter_gen_data = {
            "user_id": user.id,
            "job_description_id": body.jobDescriptionId,
            "cover_letter_id": cover_letter['id'],
            "optimized_latex": ai_content.get("optimized_latex"),
            "suggestions": ai_content.get("suggestions"),
            "ats_score": ai_content.get("ats_score"),
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
        # ... (endpoint logic) ...
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        )