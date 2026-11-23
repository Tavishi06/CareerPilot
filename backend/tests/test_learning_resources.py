from urllib.parse import urlparse

from app.services.learning_resources import LEARNING_RESOURCES
from app.services.skill_analysis import SKILL_TERMS


def test_learning_resources_cover_all_supported_skills():
    assert set(LEARNING_RESOURCES) == set(SKILL_TERMS)


def test_learning_resources_have_valid_metadata_and_prerequisites():
    for skill, resource in LEARNING_RESOURCES.items():
        assert resource.title
        assert resource.objective
        assert resource.estimated_hours > 0
        assert urlparse(resource.url).scheme == "https"
        assert all(
            prerequisite in LEARNING_RESOURCES
            for prerequisite in resource.prerequisites
        ), skill
