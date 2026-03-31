"""CLI entry point for boxsvg."""

from __future__ import annotations

import sys

import click

from boxsvg.generators import generate_dieline
from boxsvg.models import BoxRequest, SUPPORTED_LID_FITS, SUPPORTED_MATERIALS, SUPPORTED_UNITS
from boxsvg.styles import get_default_style_name, get_style_definition, get_style_names
from boxsvg.svg import render_svg
from boxsvg.units import to_inches
from boxsvg.validation import validate_output_path, validate_request, warn_unusual


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


def prompt_choice(name: str, choices: tuple[str, ...], default: str) -> str:
    """Prompt for a supported string choice."""
    choice_set = {choice.lower() for choice in choices}
    label = f"{name} ({'/'.join(choices)})"
    while True:
        value = prompt_value(label, default=default).lower()
        if value in choice_set:
            return value
        click.echo(f"  Invalid value. Choose one of: {', '.join(choices)}.")


def prompt_missing(style, length, width, height, units, material, lid, thickness, kerf, output):
    """Interactively prompt for any missing required values."""
    click.echo("Interactive mode - enter box parameters:\n")

    if style is None:
        style = prompt_choice("Box style", get_style_names(), get_default_style_name())
    else:
        style = style.lower()

    if units is None:
        units = prompt_choice("Units", SUPPORTED_UNITS, "in")
    else:
        units = units.lower()

    if length is None:
        length = float(prompt_value("Length", type_fn=float))
    if width is None:
        width = float(prompt_value("Width", type_fn=float))
    if height is None:
        height = float(prompt_value("Height", type_fn=float))

    if material is None:
        material = prompt_choice("Material", SUPPORTED_MATERIALS, "corrugated")
    else:
        material = material.lower()

    if lid is None:
        style_definition = get_style_definition(style)
        default_lid = style_definition.default_lid if style_definition is not None else "over"
        lid = prompt_choice("Lid fit", SUPPORTED_LID_FITS, default_lid)
    else:
        lid = lid.lower()

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
    """boxsvg - Parametric SVG dieline generator for cardboard boxes."""
    pass


@main.command()
@click.option("--style", type=click.Choice(get_style_names(), case_sensitive=False), help="Box style.")
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

    if style is None:
        style = get_default_style_name()
    if units is None:
        units = "in"
    if material is None:
        material = "corrugated"

    style = style.lower()
    units = units.lower()
    material = material.lower()
    style_definition = get_style_definition(style)

    if lid is None:
        lid = style_definition.default_lid if style_definition is not None else "over"
    lid = lid.lower()

    if output is None:
        output = "box.svg"

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

    errors = validate_request(request)
    if errors:
        for err in errors:
            click.echo(f"Error: {err}", err=True)
        raise SystemExit(1)

    warnings = warn_unusual(request)
    for warning in warnings:
        click.echo(f"Warning: {warning}", err=True)

    path_err = validate_output_path(output, force)
    if path_err:
        click.echo(f"Error: {path_err}", err=True)
        raise SystemExit(1)

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

    dieline = generate_dieline(request)
    svg_content = render_svg(dieline, units)

    with open(output, "w", encoding="utf-8") as f:
        f.write(svg_content)

    click.echo(f"SVG written to {output}")
