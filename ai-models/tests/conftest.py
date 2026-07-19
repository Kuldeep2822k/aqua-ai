"""Shared pytest setup for the ai-models test suite."""

import os
import sys

_AI_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _AI_DIR not in sys.path:
    sys.path.insert(0, _AI_DIR)

try:
    import tensorflow  # noqa: F401
except ModuleNotFoundError:
    from unittest.mock import MagicMock

    _tf = MagicMock()
    sys.modules["tensorflow"] = _tf
    sys.modules["tensorflow.keras"] = _tf.keras
    sys.modules["tensorflow.keras.layers"] = _tf.keras.layers
