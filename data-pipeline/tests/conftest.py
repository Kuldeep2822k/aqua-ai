"""Shared pytest setup for the data-pipeline test suite."""

import os
import sys

os.environ.setdefault(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/aqua_ai_test_db"
)

_DP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _DP_DIR not in sys.path:
    sys.path.insert(0, _DP_DIR)
