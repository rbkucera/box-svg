"""Unit conversion helpers. Internal computation uses inches."""

MM_PER_INCH = 25.4


def to_inches(value: float, units: str) -> float:
    if units == "in":
        return value
    if units == "mm":
        return value / MM_PER_INCH
    raise ValueError(f"Unsupported unit: {units}")


def from_inches(value: float, units: str) -> float:
    if units == "in":
        return value
    if units == "mm":
        return value * MM_PER_INCH
    raise ValueError(f"Unsupported unit: {units}")
