"""Unit tests for WaterQualityPredictor._determine_risk_level."""

import pytest

import train_model


@pytest.fixture(scope="module")
def predictor():
    return train_model.WaterQualityPredictor.__new__(train_model.WaterQualityPredictor)


@pytest.mark.parametrize(
    "parameter,value,expected",
    [
        ("BOD", 2, "low"),
        ("BOD", 5, "medium"),
        ("BOD", 12, "high"),
        ("Nitrates", 10, "low"),
        ("Nitrates", 150, "high"),
        ("DO", 7, "low"),
        ("DO", 5, "medium"),
        ("DO", 1, "high"),
        ("pH", 7.0, "low"),
        ("pH", 6.0, "medium"),
        ("pH", 9.0, "medium"),
        ("pH", 5.0, "high"),
        ("pH", 11.0, "high"),
        ("Unobtanium", 42, "unknown"),
    ],
)
def test_determine_risk_level(predictor, parameter, value, expected):
    assert predictor._determine_risk_level(parameter, value) == expected
