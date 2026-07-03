"""Unit tests for WaterQualityPredictor._determine_risk_level."""

import pytest

import train_model


@pytest.fixture(scope="module")
def predictor():
    # Bypass __init__ (which creates model directories and loads scalers); the
    # classifier under test is a pure function of its arguments.
    return train_model.WaterQualityPredictor.__new__(train_model.WaterQualityPredictor)


@pytest.mark.parametrize(
    "parameter,value,expected",
    [
        # "lower is better" pollutants
        ("BOD", 2, "low"),
        ("BOD", 5, "medium"),
        ("BOD", 12, "high"),
        ("Nitrates", 10, "low"),
        ("Nitrates", 150, "high"),
        # Dissolved oxygen: higher is better, so the comparison is inverted
        ("DO", 7, "low"),
        ("DO", 5, "medium"),
        ("DO", 1, "high"),
        # pH is a two-sided range around the safe band [6.5, 8.5]
        ("pH", 7.0, "low"),
        ("pH", 6.0, "medium"),
        ("pH", 9.0, "medium"),
        ("pH", 5.0, "high"),
        ("pH", 11.0, "high"),
        # Unknown parameters degrade gracefully
        ("Unobtanium", 42, "unknown"),
    ],
)
def test_determine_risk_level(predictor, parameter, value, expected):
    assert predictor._determine_risk_level(parameter, value) == expected
