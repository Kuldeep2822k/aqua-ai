"""Shared pytest setup for the ai-models test suite.

``train_model`` imports TensorFlow at module load, but the pure-Python logic we
unit-test here does not use it. When TensorFlow is not installed we register
lightweight stand-ins so the module can be imported anywhere (locally and in
CI, whether or not the heavy dependency is present).
"""

import os
import sys
import types

_AI_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _AI_DIR not in sys.path:
    sys.path.insert(0, _AI_DIR)

try:  # pragma: no cover - exercised implicitly by import side effects
    import tensorflow  # noqa: F401
except ModuleNotFoundError:
    _tf = types.ModuleType("tensorflow")
    _keras = types.ModuleType("tensorflow.keras")
    _layers = types.ModuleType("tensorflow.keras.layers")
    _keras.layers = _layers
    _tf.keras = _keras
    sys.modules["tensorflow"] = _tf
    sys.modules["tensorflow.keras"] = _keras
    sys.modules["tensorflow.keras.layers"] = _layers
