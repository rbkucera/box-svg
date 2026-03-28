"""CLI entry point for boxsvg."""

from __future__ import annotations

import sys

import click

from boxsvg.models import BoxRequest, SUPPORTED_LID_FITS, SUPPORTED_MATERIALS, SUPPORTED_STYLES, SUPPORTED_UNITS
from boxsvg.validation import validate_request, validate_output_path, warn_unusual
from boxsvg.units import to_inches
from boxsvg.generators import generate_dieline
from boxsvg.svg import render_svg


def prompt_value(name: str, default: str | None = None, type_fn=str) -> str:
    """Prompt the user for a value via stdin."""
    suffix = f" [{default}]" if default else ""
    while True:
        raw = input(f"  {name}{suffix}: ").strip()
        if not raw and default is not None:
            return default
        if raw:
            try:
                type_fn(raw)
                return raw
            except (ValueError, TypeError):
                click.echo(f"  Invalid value. Please enter a valid {name}.")
        else:
            click.echo(f"  {name} is required.")


def prompt_missing(style, length, width, height, units, material, lid, thickness, kerf, output):
    """Interactively prompt for any missing required values."""
    click.echo("Interactive mode — enter box parameters:\n")

    if style is None:
        style = prompt_value("Box style", default="mailer")
    if units is None:
        units = prompt_value("Units (in/mm)", default="in")
    if length is None:
        length = float(prompt_value("Length", type_fn=float))
    if width is None:
        width = float(prompt_value("Width", type_fn=float))
    if height is None:
        height = float(prompt_value("Height", type_fn=float))
    if material is None:
        material = prompt_value("Material (corrugated/chipboard)", default="corrugated")
    if lid is None:
        lid = prompt_value("Lid fit (over/inside)", default="over")
    if thickness is None:
        raw = input("  Thickness (optional, press Enter to skip): ").strip()
        if raw:
            thickness = float(raw)
    if kerf is None:
        raw = input("  Kerf (optional, press Enter to skip): ").strip()
        if raw:
            kerf = float(raw)
    if output is None:
        output = prompt_value("Output filename", default="box.svg")

    click.echo()
    return style, length, width, height, units, material, lid, thickness, kerf, output


@click.group()
@click.version_option(package_name="boxsvg")
def main():
    """boxsvg — Parametric SVG dieline generator for cardboard boxes."""
    pass


@main.command()
@click.option("--style", type=click.Choice(SUPPORTED_STYLES, case_sensitive=False), help="Box style.")
@click.option("--length", type=float, help="Box length.")
@click.option("--width", type=float, help="Box width.")
@click.option("--height", type=float, help="Box height.")
@click.option("--units", type=click.Choice(SUPPORTED_UNITS, case_sensitive=False), help="Measurement units.")
@click.option("--material", type=click.Choice(SUPPORTED_MATERIALS, case_sensitive=False), help="Material type.")
@click.option("--lid", type=click.Choice(SUPPORTED_LID_FITS, case_sensitive=False), help="Lid fit: 'over' wraps outside, 'inside' tucks in.")
@click.option("--thickness", type=float, help="Material thickness (in selected units).")
@click.option("--kerf", type=float, help="Laser kerf compensation (in selected units).")
@click.option("--output", "-o", type=str, help="Output SVG file path.")
@click.option("--force", is_flag=True, help="Overwrite output file if it exists.")
@click.option("--interactive", "interactive_flag", is_flag=True, default=False, help="Force interactive mode.")
@click.option("--no-interactive", "no_interactive", is_flag=True, default=False, help="Disable interactive prompts.")
def generate(style, length, width, height, units, material, lid, thickness, kerf, output, force, interactive_flag, no_interactive):
    """Generate an SVG box dieline."""
    # Determine if we need interactive prompts
    missing_required = length is None or width is None or height is None
    use_interactive = interactive_flag or (missing_required and not no_interactive and sys.stdin.isatty())

    if missing_required and no_interactive:
        missing = [name for name, val in [("length", length), ("width", width), ("height", height)] if val is None]
        click.echo(f"Error: missing required inputs: {', '.join(missing)}", err=True)
        raise SystemExit(1)

    if use_interactive:
        style, length, width, height, units, material, lid, thickness, kerf, output = prompt_missing(
            style, length, width, height, units, material, lid, thickness, kerf, output
        )

    # Apply defaults for non-interactive mode
    if style is None:
        style = "mailer"
    if units is None:
        units = "in"
    if material is None:
        material = "corrugated"
    if lid is None:
        lid = "over"
    if output is None:
        output = "box.svg"

    # Convert thickness and kerf to inches if provided
    thickness_in = to_inches(thickness, units) if thickness is not None else None
    kerf_in = to_inches(kerf, units) if kerf is not None else None

    request = BoxRequest(
        style=style,
        length=to_inches(length, units),
        width=to_inches(width, units),
        height=to_inches(height, units),
        units=units,
        material=material,
        lid=lid,
        thickness=thickness_in,
        kerf=kerf_in,
        output=output,
    )

    # Validate
    errors = validate_request(request)
    if errors:
        for err in errors:
            click.echo(f"Error: {err}", err=True)
        raise SystemExit(1)

    # Warnings
    warnings = warn_unusual(request)
    for w in warnings:
        click.echo(f"Warning: {w}", err=True)

    # Check output path
    path_err = validate_output_path(output, force)
    if path_err:
        click.echo(f"Error: {path_err}", err=True)
        raise SystemExit(1)

    # Interactive confirmation
    if use_interactive:
        click.echo(f"  Style:     {request.style}")
        click.echo(f"  Length:    {length} {units}")
        click.echo(f"  Width:     {width} {units}")
        click.echo(f"  Height:    {height} {units}")
        click.echo(f"  Material:  {request.material}")
        click.echo(f"  Output:    {output}")
        click.echo()
        confirm = input("Generate SVG? [Y/n] ").strip().lower()
        if confirm and confirm != "y":
            click.echo("Cancelled.")
            raise SystemExit(0)

    # Generate
    dieline = generate_dieline(request)
    svg_content = render_svg(dieline, units)

    with open(output, "w") as f:
        f.write(svg_content)

    click.echo(f"SVG written to {output}")
