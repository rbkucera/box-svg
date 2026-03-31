# boxsvg

Parametric SVG dieline generator for cardboard boxes. Generates laser-cut-ready SVG files with separate cut and score lines.

## Installation

```bash
pip install -e .
```

## Usage

### Full CLI mode

```bash
boxsvg generate --style mailer --length 6 --width 2 --height 3.5 --units in --output clippy-box.svg
```

```bash
boxsvg generate --style tuck-top --length 6 --width 2 --height 3.5 --units in --output tuck-top.svg
```

### Interactive mode

Run without arguments to be prompted for all values:

```bash
boxsvg generate
```

### Hybrid mode

Provide some arguments; get prompted for the rest:

```bash
boxsvg generate --length 6 --width 2
```

## CLI Reference

```text
boxsvg generate [OPTIONS]
```

| Option | Description | Default |
|---|---|---|
| `--style` | Box style (`mailer`, `tuck-top`) | `mailer` |
| `--length` | Box length (required) | - |
| `--width` | Box width (required) | - |
| `--height` | Box height (required) | - |
| `--units` | Measurement units (`in`, `mm`) | `in` |
| `--material` | Material type (`corrugated`, `chipboard`) | `corrugated` |
| `--thickness` | Material thickness | auto |
| `--kerf` | Laser kerf compensation | `0` |
| `-o, --output` | Output SVG file path | `box.svg` |
| `--force` | Overwrite existing output file | off |
| `--interactive` | Force interactive mode | off |
| `--no-interactive` | Disable interactive prompts | off |

## SVG Output

The generated SVG uses two line styles:

- **Green (`#00FF00`)** - Cut lines (outer perimeter, flap edges)
- **Red (`#FF0000`, dashed)** - Score/fold lines

Lines are grouped into `<g id="cut">` and `<g id="score">` elements for easy selection in vector editors or laser software.

## Supported Box Styles

### `mailer`

Roll-end tuck-top shipping box. Generates:

- Bottom panel with dust flaps
- Front panel with side flaps
- Top panel with side flaps
- Tuck flap for closure

### `tuck-top`

Folding carton with a glue tab and tapered tuck closure. Generates:

- Four body panels in a wraparound carton layout
- Side dust flaps
- A top tuck flap with a top closure panel
- A bottom tuck flap with a bottom closure panel

This style uses an inside tuck fit, so `--lid inside` is the supported option.

## Adding A New Box Style

The codebase is set up so new templates can be added through the style registry.

1. Create a generator module under `boxsvg/generators/` that accepts a `BoxRequest` and returns a `Dieline`.
2. Register the style in `boxsvg/styles.py` with its name, description, generator, and any style-specific defaults or validation.
3. Add geometry tests under `tests/` for the new template.
4. Update this README if the new style should appear in the public CLI docs.

The CLI choices, generator dispatch, and style validation are all driven from `boxsvg/styles.py`, so a new template no longer needs separate hard-coded updates across multiple modules.

## Development

```bash
pip install -e ".[dev]"
pytest
```
