"""Tests for the style registry and registry-driven behavior."""

from boxsvg.generators import generate_dieline
from boxsvg.models import BoxRequest
from boxsvg.styles import BoxStyleDefinition, get_default_style_name, get_style_definition, get_style_names
from boxsvg.validation import validate_request, validate_style_request


def make_request(**overrides):
    defaults = dict(
        style="mailer",
        length=6.0,
        width=2.0,
        height=3.5,
        units="in",
        material="corrugated",
        lid="over",
    )
    defaults.update(overrides)
    return BoxRequest(**defaults)


def test_default_style_is_registered():
    assert get_default_style_name() in get_style_names()


def test_registered_styles_have_generators():
    for name in get_style_names():
        style_definition = get_style_definition(name)
        assert style_definition is not None
        assert callable(style_definition.generator)


def test_generate_dieline_uses_style_registry():
    result = generate_dieline(make_request(style="mailer"))
    assert result.width > 0
    assert result.height > 0


def test_unknown_style_fails_validation():
    errors = validate_request(make_request(style="unknown-style"))
    assert any("Unsupported style" in error for error in errors)


def test_style_specific_validator_is_called():
    request = make_request()
    style_definition = BoxStyleDefinition(
        name="test-style",
        description="Test style",
        generator=lambda req: generate_dieline(req),
        validator=lambda req: ["style validation ran"],
    )

    assert validate_style_request(request, style_definition) == ["style validation ran"]


def test_tuck_top_definition_uses_inside_lid_default():
    style_definition = get_style_definition("tuck-top")
    assert style_definition is not None
    assert style_definition.default_lid == "inside"
