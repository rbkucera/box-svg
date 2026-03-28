"""Input validation for box requests."""

from __future__ import annotations

import os
from pathlib import Path

from boxsvg.models import (
    BoxRequest,
    SUPPORTED_MATERIALS,
    SUPPORTED_STYLES,
    SUPPORTED_UNITS,
)


class ValidationError(Exception):
    pass


def validate_request(request: BoxRequest) -> list[str]:
    """Validate a BoxRequest. Returns list of error messages (empty if valid)."""
    errors: list[str] = []

    if request.style not in SUPPORTED_STYLES:
        errors.append(
            f"Unsupported style: '{request.style}'. "
            f"Supported: {', '.join(SUPPORTED_STYLES)}"
        )

    if request.units not in SUPPORTED_UNITS:
        errors.append(
            f"Unsupported units: '{request.units}'. "
            f"Supported: {', '.join(SUPPORTED_UNITS)}"
        )

    if request.material not in SUPPORTED_MATERIALS:
        errors.append(
            f"Unsupported material: '{request.material}'. "
            f"Supported: {', '.join(SUPPORTED_MATERIALS)}"
        )

    for dim_name in ("length", "width", "height"):
        value = getattr(request, dim_name)
        if value <= 0:
            errors.append(f"{dim_name} must be greater than 0, got {value}")

    if request.thickness is not None and request.thickness <= 0:
        errors.append(f"thickness must be greater than 0, got {request.thickness}")

    if request.kerf is not None and request.kerf < 0:
        errors.append(f"kerf must be non-negative, got {request.kerf}")

    return errors


def validate_output_path(path: str, force: bool = False) -> str | None:
    """Validate output file path. Returns error message or None."""
    p = Path(path)
    if p.exists() and not force:
        return f"Output file '{path}' already exists. Use --force to overwrite."
    parent = p.parent
    if not parent.exists():
        return f"Output directory '{parent}' does not exist."
    if parent.exists() and not os.access(parent, os.W_OK):
        return f"Output directory '{parent}' is not writable."
    return None


def warn_unusual(request: BoxRequest) -> list[str]:
    """Return warnings for unusual but not invalid inputs."""
    warnings: list[str] = []
    max_dim = max(request.length, request.width, request.height)
    min_dim = min(request.length, request.width, request.height)
    if max_dim / min_dim > 10:
        warnings.append("Extreme aspect ratio detected — verify dimensions are correct.")
    if request.kerf is not None and request.kerf > 0.05:
        warnings.append(
            f"Kerf value {request.kerf} seems high — typical values are under 0.05 inches."
        )
    return warnings
