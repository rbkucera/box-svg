"""Box dieline generators."""

from __future__ import annotations

from boxsvg.models import BoxRequest, Dieline


def generate_dieline(request: BoxRequest) -> Dieline:
    """Dispatch to the appropriate generator based on box style."""
    from boxsvg.styles import get_style_definition

    style_definition = get_style_definition(request.style)
    if style_definition is None:
        raise ValueError(f"No generator for style: {request.style}")
    return style_definition.generator(request)
