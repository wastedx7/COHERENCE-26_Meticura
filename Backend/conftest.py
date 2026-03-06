"""
Pytest configuration for Budget Watchdog tests
"""
import pytest
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))


@pytest.fixture(scope="session")
def test_config():
    """Provide test configuration"""
    return {
        "database_url": "sqlite:///:memory:",
        "testing": True,
    }


@pytest.fixture(autouse=True)
def reset_imports():
    """Reset imports between tests"""
    yield
    # Cleanup can be added here if needed


# Markers for test categorization
def pytest_configure(config):
    """Register custom markers"""
    config.addinivalue_line(
        "markers", "unit: mark test as a unit test"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as an integration test"
    )
    config.addinivalue_line(
        "markers", "smoke: mark test as a smoke test"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )
