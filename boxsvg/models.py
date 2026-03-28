"""Data models for box generation."""

from __future__ import annotations

from dataclasses import dataclass, field


SUPPORTED_STYLES = ("mailer",)
SUPPORTED_UNITS = ("in", "mm")
SUPPORTED_MATERIALS = ("corrugated", "chipboard")

# Default material thicknesses in inches
DEFAULT_THICKNESS = {
    "corrugated": 0.125,  # ~3mm E-flute
    "chipboard": 0.050,
}


@dataclass
class BoxRequest:
    style: str
    length: float
    width: float
    height: float
    units: str = "in"
    material: str = "corrugated"
    thickness: float | None = None
    kerf: float | None = None
    output: str | None = None

    def effective_thickness(self) -> float:
        if self.thickness is not None:
            return self.thickness
        return DEFAULT_THICKNESS.get(self.material, 0.125)

    def effective_kerf(self) -> float:
        return self.kerf if self.kerf is not None else 0.0


@dataclass
class Line:
    x1: float
    y1: float
    x2: float
    y2: float
    kind: str  # "cut" or "score"


@dataclass
class Dieline:
    width: float
    height: float
    lines: list[Line] = field(default_factory=list)
