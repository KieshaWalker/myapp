import os
import sys
from pathlib import Path

# Ensure `app` package is importable when running tests from repo root
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Provide safe defaults for env vars the app expects
os.environ.setdefault("MONGODB_URI", "")
os.environ.setdefault("MONGODB_DB", "testdb")
os.environ.setdefault("NUTRITIONIX_APP_ID", "dummy")
os.environ.setdefault("NUTRITIONIX_API_KEY", "dummy")