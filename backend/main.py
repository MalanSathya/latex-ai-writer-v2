import os
# import json
import base64
import subprocess
import tempfile
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
# from supabase import create_client, Client
# from openai import OpenAI
from typing import Optional

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

# --- API Endpoints ---
@app.get("/")
async def root():
    return {"status": "ok", "message": "Backend is running without Supabase or OpenAI."}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# The other endpoints are now disabled because their dependencies are commented out.
# This is a temporary measure to isolate the cause of the crash.
