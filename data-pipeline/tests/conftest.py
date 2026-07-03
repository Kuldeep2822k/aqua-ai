"""Shared pytest fixtures/setup for the data-pipeline test suite.

These hooks make the data-pipeline modules importable no matter which directory
pytest is invoked from (locally we run from ``data-pipeline``; CI runs from the
repository root with ``pytest --cov=.``).
"""

import os
import sys

# Ensure ``config`` and ``fetch_data`` resolve regardless of the pytest rootdir.
_DP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _DP_DIR not in sys.path:
    sys.path.insert(0, _DP_DIR)

# config.py instantiates ``DB_CONFIG = DBConfig()`` at import time, which requires
# a database URL (or DB_PASSWORD). Provide a harmless default for the test run so
# importing the module never touches a real database.
os.environ.setdefault(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/aqua_ai_test_db"
)
