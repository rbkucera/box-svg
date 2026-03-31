"""Style registry for box templates."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable

from boxsvg.generators.mailer import generate_mailer_dieline
from boxsvg.generators.tuck_top import generate_tuck_top_dieline
from boxsvg.models import BoxRequest, Dieline


StyleGenerator = Callable[[BoxRequest], Dieline]
StyleValidator = Callable[[BoxRequest], list[str]]


@dataclass(frozen=True)
class BoxStyleDefinition:
    """Metadata and behavior for a single box style."""

    name: str
    description: str
    generator: StyleGenerator
    default_lid: str = "over"
    validator: StyleValidator | None = None


def _validate_tuck_top(request: BoxRequest) -> list[str]:
    """Validate tuck-top specific constraints."""
    if request.lid != "inside":
        return ["Tuck-top boxes require lid fit 'inside'."]
    return []


_STYLE_DEFINITIONS = (
    BoxStyleDefinition(
        name="mailer",
        description="Roll-end tuck-top shipping box.",
        generator=generate_mailer_dieline,
        default_lid="over",
    ),
    BoxStyleDefinition(
        name="tuck-top",
        description="Folding carton with a tapered top tuck flap and glue tab.",
        generator=generate_tuck_top_dieline,
        default_lid="inside",
        validator=_validate_tuck_top,
    ),
)

_STYLE_MAP = {style.name: style for style in _STYLE_DEFINITIONS}
_DEFAULT_STYLE_NAME = "mailer"


def get_style_definition(name: str) -> BoxStyleDefinition | None:
    """Return the style definition for a style name, if registered."""
    return _STYLE_MAP.get(name.lower())


def get_style_definitions() -> tuple[BoxStyleDefinition, ...]:
    """Return all registered style definitions."""
    return _STYLE_DEFINITIONS


def get_style_names() -> tuple[str, ...]:
    """Return the registered style names in display order."""
    return tuple(style.name for style in _STYLE_DEFINITIONS)


def get_default_style_name() -> str:
    """Return the default style name for the CLI."""
    return _DEFAULT_STYLE_NAME
