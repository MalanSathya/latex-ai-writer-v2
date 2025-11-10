WARN! Due to `builds` existing in your configuration file, the Build and Development Settings defined in your Project Settings will not apply. Learn More: https://vercel.link/unused-build-settings
No Python version specified in pyproject.toml or Pipfile.lock. Using latest installed version: 3.12
Installing required dependencies from requirements.txt...
Using uv at "/usr/local/bin/uv"
Failed to run "/usr/local/bin/uv pip install --no-compile --no-cache-dir --target /vercel/path0/backend/.vercel/python/py3.12/\_vendor --upgrade -r /vercel/path0/backend/requirements.txt", falling back to pip
Failed to run "pip3.12 install --disable-pip-version-check --no-compile --no-cache-dir --target /vercel/path0/backend/.vercel/python/py3.12/\_vendor --upgrade -r /vercel/path0/backend/requirements.txt"
Error: Command failed: pip3.12 install --disable-pip-version-check --no-compile --no-cache-dir --target /vercel/path0/backend/.vercel/python/py3.12/\_vendor --upgrade -r /vercel/path0/backend/requirements.txt
ERROR: Could not find a version that satisfies the requirement mistralai==1.9.4 (from versions: 0.0.7, 0.0.8, 0.0.9, 0.0.10, 0.0.11, 0.0.12, 0.1.2, 0.1.3, 0.1.6, 0.1.7, 0.1.8, 0.2.0, 0.3.0, 0.4.0, 0.4.1, 0.4.2, 1.0.0rc1, 1.0.0rc2, 1.0.0, 1.0.1, 1.0.2, 1.0.3, 1.1.0, 1.2.0, 1.2.1, 1.2.2, 1.2.3, 1.2.4, 1.2.5, 1.2.6, 1.3.0, 1.3.1, 1.4.0, 1.5.0, 1.5.1, 1.5.2rc1, 1.5.2, 1.6.0, 1.7.0, 1.7.1, 1.8.0, 1.8.1, 1.8.2, 1.9.1, 1.9.2, 1.9.3, 1.9.6, 1.9.7, 1.9.8, 1.9.9, 1.9.10, 1.9.11)
ERROR: No matching distribution found for mistralai==1.9.4
