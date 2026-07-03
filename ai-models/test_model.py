import pytest
import sys
import os

# Ensure the ai-models directory is on the import path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def test_core_dependencies_available():
    """
    Verify that core ML dependencies can be imported without errors.
    This catches broken installations or missing packages in CI.
    """
    import pandas as pd
    import numpy as np
    import sklearn

    assert pd.__version__
    assert np.__version__
    assert sklearn.__version__


def test_train_model_module_loads():
    """
    Verify the train_model module can be imported and contains the
    expected WaterQualityPredictor class.
    """
    import train_model

    assert train_model.__doc__ is not None
    assert hasattr(train_model, "WaterQualityPredictor")


def test_water_quality_predictor_init():
    """
    Verify WaterQualityPredictor can be instantiated with default args
    without crashing (no DB or file access needed at init time).
    """
    from train_model import WaterQualityPredictor

    predictor = WaterQualityPredictor()
    assert predictor.models == {}
    assert predictor.scalers == {}
    assert predictor.feature_columns == []
