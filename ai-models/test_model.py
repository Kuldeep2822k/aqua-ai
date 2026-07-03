import pytest
import sys
import os
from pathlib import Path

# Ensure the module can be found
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_imports_and_environment():
    """
    Basic sanity test to ensure ML dependencies and the main training script
    can be imported without syntax or dependency errors.
    """
    try:
        import pandas as pd
        import numpy as np
        import sklearn
        import train_model
        
        assert pd is not None
        assert np is not None
        assert sklearn is not None
        assert train_model is not None
    except ImportError as e:
        pytest.fail(f"Failed to import a required module: {e}")

def test_model_module_has_functions():
    """
    Check if the train_model module has basic expected attributes/functions
    without actually running the heavy training process.
    """
    import train_model
    # Just asserting the module loaded and has a docstring at minimum
    assert train_model.__doc__ is not None
