14:33:02.049 Running build in Washington, D.C., USA (East) – iad1
14:33:02.050 Build machine configuration: 2 cores, 8 GB
14:33:02.173 Cloning github.com/MalanSathya/latex-ai-writer-v2 (Branch: main, Commit: 4c62af7)
14:33:02.173 Previous build caches not available.
14:33:02.431 Cloning completed: 258.000ms
14:33:02.806 Running "vercel build"
14:33:03.211 Vercel CLI 48.9.0
14:33:03.378 WARN! Due to `builds` existing in your configuration file, the Build and Development Settings defined in your Project Settings will not apply. Learn More: https://vercel.link/unused-build-settings
14:33:03.412 No Python version specified in pyproject.toml or Pipfile.lock. Using latest installed version: 3.12
14:33:03.414 Installing required dependencies from requirements.txt...
14:33:03.415 Using uv at "/usr/local/bin/uv"
14:33:04.109 Failed to run "/usr/local/bin/uv pip install --no-compile --no-cache-dir --target /vercel/path0/backend/.vercel/python/py3.12/\_vendor --upgrade -r /vercel/path0/backend/requirements.txt", falling back to pip
14:33:06.764 Failed to run "pip3.12 install --disable-pip-version-check --no-compile --no-cache-dir --target /vercel/path0/backend/.vercel/python/py3.12/\_vendor --upgrade -r /vercel/path0/backend/requirements.txt"
14:33:06.767 Error: Command failed: pip3.12 install --disable-pip-version-check --no-compile --no-cache-dir --target /vercel/path0/backend/.vercel/python/py3.12/\_vendor --upgrade -r /vercel/path0/backend/requirements.txt
14:33:06.768 ERROR: Cannot install -r /vercel/path0/backend/requirements.txt (line 7), -r /vercel/path0/backend/requirements.txt (line 8) and httpx==0.28.0 because these package versions have conflicting dependencies.
14:33:06.768 ERROR: ResolutionImpossible: for help visit https://pip.pypa.io/en/latest/topics/dependency-resolution/#dealing-with-dependency-conflicts
14:33:06.768
14:33:06.769 Collecting fastapi==0.121.0 (from -r /vercel/path0/backend/requirements.txt (line 1))
14:33:06.769 Downloading fastapi-0.121.0-py3-none-any.whl.metadata (28 kB)
14:33:06.769 Collecting uvicorn==0.38.0 (from -r /vercel/path0/backend/requirements.txt (line 2))
14:33:06.769 Downloading uvicorn-0.38.0-py3-none-any.whl.metadata (6.8 kB)
14:33:06.770 Collecting python-multipart==0.0.20 (from -r /vercel/path0/backend/requirements.txt (line 3))
14:33:06.770 Downloading python_multipart-0.0.20-py3-none-any.whl.metadata (1.8 kB)
14:33:06.770 Collecting pydantic==2.12.4 (from -r /vercel/path0/backend/requirements.txt (line 4))
14:33:06.770 Downloading pydantic-2.12.4-py3-none-any.whl.metadata (89 kB)
14:33:06.771 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 89.9/89.9 kB 34.2 MB/s eta 0:00:00
14:33:06.771 Collecting starlette==0.49.3 (from -r /vercel/path0/backend/requirements.txt (line 5))
14:33:06.771 Downloading starlette-0.49.3-py3-none-any.whl.metadata (6.4 kB)
14:33:06.771 Collecting typing-extensions==4.15.0 (from -r /vercel/path0/backend/requirements.txt (line 6))
14:33:06.773 Downloading typing_extensions-4.15.0-py3-none-any.whl.metadata (3.3 kB)
14:33:06.773 Collecting supabase==2.23.3 (from -r /vercel/path0/backend/requirements.txt (line 7))
14:33:06.774 Downloading supabase-2.23.3-py3-none-any.whl.metadata (4.6 kB)
14:33:06.774 Collecting mistralai==1.9.6 (from -r /vercel/path0/backend/requirements.txt (line 8))
14:33:06.774 Downloading mistralai-1.9.6-py3-none-any.whl.metadata (37 kB)
14:33:06.774 Collecting httpx==0.28.0 (from -r /vercel/path0/backend/requirements.txt (line 9))
14:33:06.774 Downloading httpx-0.28.0-py3-none-any.whl.metadata (7.1 kB)
14:33:06.775 Collecting annotated-doc>=0.0.2 (from fastapi==0.121.0->-r /vercel/path0/backend/requirements.txt (line 1))
14:33:06.775 Downloading annotated_doc-0.0.3-py3-none-any.whl.metadata (6.6 kB)
14:33:06.775 Collecting click>=7.0 (from uvicorn==0.38.0->-r /vercel/path0/backend/requirements.txt (line 2))
14:33:06.775 Downloading click-8.3.0-py3-none-any.whl.metadata (2.6 kB)
14:33:06.775 Collecting h11>=0.8 (from uvicorn==0.38.0->-r /vercel/path0/backend/requirements.txt (line 2))
14:33:06.776 Downloading h11-0.16.0-py3-none-any.whl.metadata (8.3 kB)
14:33:06.776 Collecting annotated-types>=0.6.0 (from pydantic==2.12.4->-r /vercel/path0/backend/requirements.txt (line 4))
14:33:06.776 Downloading annotated_types-0.7.0-py3-none-any.whl.metadata (15 kB)
14:33:06.777 Collecting pydantic-core==2.41.5 (from pydantic==2.12.4->-r /vercel/path0/backend/requirements.txt (line 4))
14:33:06.777 Downloading pydantic_core-2.41.5-cp312-cp312-manylinux_2_17_x86_64.manylinux2014_x86_64.whl.metadata (7.3 kB)
14:33:06.777 Collecting typing-inspection>=0.4.2 (from pydantic==2.12.4->-r /vercel/path0/backend/requirements.txt (line 4))
14:33:06.777 Downloading typing_inspection-0.4.2-py3-none-any.whl.metadata (2.6 kB)
14:33:06.778 Collecting anyio<5,>=3.6.2 (from starlette==0.49.3->-r /vercel/path0/backend/requirements.txt (line 5))
14:33:06.780 Downloading anyio-4.11.0-py3-none-any.whl.metadata (4.1 kB)
14:33:06.781 Collecting realtime==2.23.3 (from supabase==2.23.3->-r /vercel/path0/backend/requirements.txt (line 7))
14:33:06.781 Downloading realtime-2.23.3-py3-none-any.whl.metadata (7.0 kB)
14:33:06.781 Collecting supabase-functions==2.23.3 (from supabase==2.23.3->-r /vercel/path0/backend/requirements.txt (line 7))
14:33:06.781 Downloading supabase_functions-2.23.3-py3-none-any.whl.metadata (2.4 kB)
14:33:06.781 Collecting storage3==2.23.3 (from supabase==2.23.3->-r /vercel/path0/backend/requirements.txt (line 7))
14:33:06.782 Downloading storage3-2.23.3-py3-none-any.whl.metadata (2.1 kB)
14:33:06.782 Collecting supabase-auth==2.23.3 (from supabase==2.23.3->-r /vercel/path0/backend/requirements.txt (line 7))
14:33:06.782 Downloading supabase_auth-2.23.3-py3-none-any.whl.metadata (6.4 kB)
14:33:06.782 Collecting postgrest==2.23.3 (from supabase==2.23.3->-r /vercel/path0/backend/requirements.txt (line 7))
14:33:06.782 Downloading postgrest-2.23.3-py3-none-any.whl.metadata (3.4 kB)
14:33:06.782 Collecting eval-type-backport>=0.2.0 (from mistralai==1.9.6->-r /vercel/path0/backend/requirements.txt (line 8))
14:33:06.782 Downloading eval_type_backport-0.2.2-py3-none-any.whl.metadata (2.2 kB)
14:33:06.783 INFO: pip is looking at multiple versions of mistralai to determine which version is compatible with other requirements. This could take a while.
14:33:06.783
14:33:06.783 The conflict is caused by:
14:33:06.783 The user requested httpx==0.28.0
14:33:06.783 supabase 2.23.3 depends on httpx<0.29 and >=0.26
14:33:06.784 mistralai 1.9.6 depends on httpx>=0.28.1
14:33:06.784
14:33:06.784 To fix this you could try to:
14:33:06.784 1. loosen the range of package versions you've specified
14:33:06.784 2. remove package versions to allow pip attempt to solve the dependency conflict
14:33:06.784
14:33:06.784

My other procject requirements here:

# Core web framework

fastapi==0.116.1
uvicorn==0.35.0
python-multipart==0.0.9
python-dotenv==1.1.1
pydantic==2.11.7
mangum==0.17.0

# AI integration

mistralai==1.9.2

# Supabase client

supabase==2.17.0

# JWT handling

PyJWT==2.10.1

# HTTP client

httpx==0.28.1

# Diagram generation

graphviz==0.20.1
