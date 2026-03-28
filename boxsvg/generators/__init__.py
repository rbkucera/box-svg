"""Box dieline generators."""

from __future__ import annotations

from boxsvg.models import BoxRequest, Dieline
from boxsvg.generators.mailer import generate_mailer_dieline


GENERATORS = {
    "mailer": generate_mailer_dieline,
}


def generate_dieline(request: BoxRequest) -> Dieline:
    """Dispatch to the appropriate generator based on box style."""
    generator = GENERATORS.get(request.style)
    if generator is None:
        raise ValueError(f"No generator for style: {request.style}")
    return generator(request)
