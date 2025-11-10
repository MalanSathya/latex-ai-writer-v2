API Integration
Endpoint
POST /api/convert
Authentication
x-api-key: YOUR_API_KEY
cURL Example
curl -X POST https://mynsuwuznnjqwhaurcmk.supabase.co/functions/v1/latex-convert \
 -H "x-api-key: YOUR_API_KEY" \
 -H "Content-Type: application/json" \
 -d '{"latex": "\\documentclass{article}\\begin{document}Hello\\end{document}"}'
JavaScript Example
const response = await fetch(
'https://mynsuwuznnjqwhaurcmk.supabase.co/functions/v1/latex-convert',
{
method: 'POST',
headers: {
'x-api-key': 'YOUR_API_KEY',
'Content-Type': 'application/json',
},
body: JSON.stringify({
latex: '\\documentclass{article}\\begin{document}Hello\\end{document}'
}),
}
);
const data = await response.json();
Binary PDF Support
External apps can use ?format=binary or set Accept: application/pdf to receive the PDF directly.

The Python backend has been updated to fix the "Python process exited with exit status: 1" error and now uses your external LaTeX to PDF conversion service.

Here's a summary of the changes:

*   **`backend/main.py` Modified:**
    *   The `generate_pdf` endpoint now makes an HTTP POST request to `https://mynsuwuznnjqwhaurcmk.supabase.co/functions/v1/latex-convert`.
    *   It now includes the necessary `x-api-key` header for authentication.
    *   The request payload correctly sends the LaTeX content in a JSON format: `{"latex": "..."}`.
    *   It expects a binary PDF response, which is then base64 encoded before being returned.
    *   The `LatexRequest` Pydantic model has been updated to `latex: str` to match the API expectation.
    *   Required imports (`httpx`, `base64`) were added, and unused ones (`subprocess`, `tempfile`) were removed.
    *   A new environment variable `LATEX_API_KEY` is referenced.

*   **`backend/requirements.txt` Modified:**
    *   The `httpx` library has been added as a dependency.

**Next Steps for You:**

1.  **Set `LATEX_API_KEY`:** You **must** set the `LATEX_API_KEY` environment variable in your Vercel deployment (or local environment if running locally). This key is essential for authenticating with your LaTeX to PDF conversion service.
2.  Redeploy your backend.

The backend should now run without crashing and successfully generate PDFs using your external service.