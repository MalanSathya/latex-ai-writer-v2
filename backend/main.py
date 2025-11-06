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

# --- Environment Variables & Client Initialization ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

# Hard-fail on startup if secrets are not present.
# This will cause a clear error in Vercel logs if not configured.
if not all([SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY]):
    raise RuntimeError("Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY")

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

class GenerateCoverLetterRequest(BaseModel):
    jobDescriptionId: str

# --- Default Prompts ---
DEFAULT_AI_PROMPT = """CAREERMAX v3.0 - ATS Resume Optimizer
# ... (rest of the prompt) ...
"""

DEFAULT_COVER_LETTER_PROMPT = """CAREERMAX v3.0 - ATS Cover Letter Generator
# ... (rest of the prompt) ...
"""


# --- API Endpoints ---
@app.get("/")
async def root():
    return {"status": "ok", "message": "LaTeX AI Writer v2 Backend API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/optimize-resume")
async def optimize_resume(req: Request, body: OptimizeResumeRequest):
    try:
        # ... (endpoint logic) ...
    except Exception as e:
        print(f"An unexpected error occurred in optimize-resume: {e}")
        raise HTTPException(status_code=500, detail=f"An unexpected server error occurred: {str(e)}")


@app.post("/generate-cover-letter")
async def generate_cover_letter(req: Request, body: GenerateCoverLetterRequest):
    try:
        # ... (endpoint logic) ...
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