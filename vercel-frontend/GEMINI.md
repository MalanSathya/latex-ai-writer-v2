Backend vercel deployment failed logs:

19:40:03.395 Running build in Washington, D.C., USA (East) – iad1
19:40:03.396 Build machine configuration: 2 cores, 8 GB
19:40:03.547 Cloning github.com/MalanSathya/latex-ai-writer-v2 (Branch: main, Commit: 7e3d5fc)
19:40:03.548 Previous build caches not available.
19:40:03.767 Cloning completed: 219.000ms
19:40:04.382 Running "vercel build"
19:40:04.793 Vercel CLI 48.9.0
19:40:04.966 WARN! Due to `builds` existing in your configuration file, the Build and Development Settings defined in your Project Settings will not apply. Learn More: https://vercel.link/unused-build-settings
19:40:04.997 No Python version specified in pyproject.toml or Pipfile.lock. Using latest installed version: 3.12
19:40:05.000 Installing required dependencies from requirements.txt...
19:40:05.001 Using uv at "/usr/local/bin/uv"
19:40:05.925 Failed to run "/usr/local/bin/uv pip install --no-compile --no-cache-dir --target /vercel/path0/backend/.vercel/python/py3.12/\_vendor --upgrade -r /vercel/path0/backend/requirements.txt", falling back to pip
19:40:07.149 Failed to run "pip3.12 install --disable-pip-version-check --no-compile --no-cache-dir --target /vercel/path0/backend/.vercel/python/py3.12/\_vendor --upgrade -r /vercel/path0/backend/requirements.txt"
19:40:07.152 Error: Command failed: pip3.12 install --disable-pip-version-check --no-compile --no-cache-dir --target /vercel/path0/backend/.vercel/python/py3.12/\_vendor --upgrade -r /vercel/path0/backend/requirements.txt
19:40:07.153 ERROR: Ignored the following yanked versions: 0.1.0rc2
19:40:07.153 ERROR: Could not find a version that satisfies the requirement google-generativeai==0.9.0 (from versions: 0.1.0rc1, 0.1.0rc3, 0.1.0, 0.2.0, 0.2.1, 0.2.2, 0.3.0, 0.3.1, 0.3.2, 0.4.0, 0.4.1, 0.5.0, 0.5.1, 0.5.2, 0.5.3, 0.5.4, 0.6.0, 0.7.0, 0.7.1, 0.7.2, 0.8.0, 0.8.1, 0.8.2, 0.8.3, 0.8.4, 0.8.5)
19:40:07.153 ERROR: No matching distribution found for google-generativeai==0.9.0
19:40:07.153
19:40:07.154 Collecting fastapi==0.121.0 (from -r /vercel/path0/backend/requirements.txt (line 1))
19:40:07.154 Downloading fastapi-0.121.0-py3-none-any.whl.metadata (28 kB)
19:40:07.154 Collecting uvicorn==0.38.0 (from -r /vercel/path0/backend/requirements.txt (line 2))
19:40:07.154 Downloading uvicorn-0.38.0-py3-none-any.whl.metadata (6.8 kB)
19:40:07.154 Collecting python-multipart==0.0.20 (from -r /vercel/path0/backend/requirements.txt (line 3))
19:40:07.154 Downloading python_multipart-0.0.20-py3-none-any.whl.metadata (1.8 kB)
19:40:07.155 Collecting pydantic==2.12.4 (from -r /vercel/path0/backend/requirements.txt (line 4))
19:40:07.155 Downloading pydantic-2.12.4-py3-none-any.whl.metadata (89 kB)
19:40:07.155 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 89.9/89.9 kB 30.5 MB/s eta 0:00:00
19:40:07.155 Collecting starlette==0.49.3 (from -r /vercel/path0/backend/requirements.txt (line 5))
19:40:07.155 Downloading starlette-0.49.3-py3-none-any.whl.metadata (6.4 kB)
19:40:07.156 Collecting typing-extensions==4.15.0 (from -r /vercel/path0/backend/requirements.txt (line 6))
19:40:07.156 Downloading typing_extensions-4.15.0-py3-none-any.whl.metadata (3.3 kB)
19:40:07.156 Collecting supabase==2.23.3 (from -r /vercel/path0/backend/requirements.txt (line 7))
19:40:07.156 Downloading supabase-2.23.3-py3-none-any.whl.metadata (4.6 kB)
19:40:07.156 Collecting openai==2.7.1 (from -r /vercel/path0/backend/requirements.txt (line 8))
19:40:07.156 Downloading openai-2.7.1-py3-none-any.whl.metadata (29 kB)
19:40:07.157
