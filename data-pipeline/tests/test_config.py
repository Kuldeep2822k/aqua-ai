"""Unit tests for data-pipeline configuration parsing and reference data."""

import pytest

import config

_DB_ENV_KEYS = ["DATABASE_URL", "DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD"]


def _make_dbconfig(monkeypatch, **env):
    """Build DBConfig with only the supplied environment values."""
    for key in _DB_ENV_KEYS:
        monkeypatch.delenv(key, raising=False)
    for key, value in env.items():
        monkeypatch.setenv(key, value)
    return config.DBConfig()


class TestDBConfig:
    """Tests for database configuration parsing."""

    def test_parses_database_url(self, monkeypatch):
        """Parse host, port, database, username, and password from DATABASE_URL."""
        cfg = _make_dbconfig(
            monkeypatch,
            DATABASE_URL="postgresql://alice:s3cret@db.example.com:6543/waterdb",
        )
        assert cfg.host == "db.example.com"
        assert cfg.port == 6543
        assert cfg.database == "waterdb"
        assert cfg.username == "alice"
        assert cfg.password == "s3cret"

    def test_connection_string_roundtrips(self, monkeypatch):
        """Recreate a connection string from parsed DATABASE_URL values."""
        url = "postgresql://alice:s3cret@db.example.com:6543/waterdb"
        cfg = _make_dbconfig(monkeypatch, DATABASE_URL=url)
        assert cfg.connection_string == url

    def test_database_url_applies_defaults_for_missing_parts(self, monkeypatch):
        """Use default port and database when DATABASE_URL omits them."""
        cfg = _make_dbconfig(monkeypatch, DATABASE_URL="postgresql://bob:pw@localhost")
        assert cfg.port == 5432
        assert cfg.database == "aqua_ai_db"

    def test_falls_back_to_individual_env_vars(self, monkeypatch):
        """Read connection settings from individual database environment variables."""
        cfg = _make_dbconfig(
            monkeypatch,
            DB_HOST="h",
            DB_PORT="1234",
            DB_NAME="n",
            DB_USER="u",
            DB_PASSWORD="p",
        )
        assert (cfg.host, cfg.port, cfg.database, cfg.username, cfg.password) == (
            "h",
            1234,
            "n",
            "u",
            "p",
        )

    def test_missing_password_and_url_raises(self, monkeypatch):
        """Reject configuration without DATABASE_URL or DB_PASSWORD."""
        with pytest.raises(ValueError):
            _make_dbconfig(monkeypatch)


class TestAPIConfig:
    """Tests for API configuration defaults and registry values."""

    def test_defaults(self):
        """Provide safe API client defaults when only base_url is supplied."""
        api = config.APIConfig(base_url="https://example.gov")
        assert api.api_key is None
        assert api.rate_limit == 100
        assert api.timeout == 30
        assert api.retry_attempts == 3

    def test_government_apis_are_registered(self):
        """Expose the expected government API entries with HTTPS base URLs."""
        assert "data_gov_in" in config.GOVERNMENT_APIS
        assert "weather_api" in config.GOVERNMENT_APIS
        for api in config.GOVERNMENT_APIS.values():
            assert api.base_url.startswith("https://")


class TestWaterQualityParameters:
    """Tests for water-quality parameter metadata."""

    def test_every_parameter_has_name_and_unit(self):
        """Require every configured parameter to include display metadata."""
        for code, meta in config.WATER_QUALITY_PARAMETERS.items():
            assert meta.get("name"), f"{code} is missing a display name"
            assert "unit" in meta, f"{code} is missing a unit"

    def test_ph_uses_range_thresholds(self):
        """Represent pH safety using lower and upper range thresholds."""
        ph = config.WATER_QUALITY_PARAMETERS["pH"]
        assert ph["safe_min"] < ph["safe_max"]


class TestIndianWaterBodies:
    """Tests for bundled Indian water body reference data."""

    def test_coordinates_lie_within_india(self):
        """Keep configured coordinates inside a rough mainland India bounding box."""
        for state, meta in config.INDIAN_WATER_BODIES.items():
            assert isinstance(meta["rivers"], list) and meta["rivers"], state
            lat, lon = meta["coordinates"]
            assert 6 <= lat <= 38, f"{state} latitude out of range"
            assert 68 <= lon <= 98, f"{state} longitude out of range"
