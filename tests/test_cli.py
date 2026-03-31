"""Tests for registry-driven CLI behavior."""

from click.testing import CliRunner

from boxsvg.cli import main
from boxsvg.styles import get_default_style_name


def test_generate_help_lists_registered_style():
    runner = CliRunner()

    result = runner.invoke(main, ["generate", "--help"])

    assert result.exit_code == 0
    assert get_default_style_name() in result.output
    assert "tuck-top" in result.output


def test_generate_uses_registry_default_style(tmp_path):
    runner = CliRunner()
    output = tmp_path / "box.svg"

    result = runner.invoke(
        main,
        [
            "generate",
            "--length",
            "6",
            "--width",
            "2",
            "--height",
            "3.5",
            "--output",
            str(output),
        ],
    )

    assert result.exit_code == 0
    assert output.exists()


def test_generate_tuck_top_uses_style_default_lid(tmp_path):
    runner = CliRunner()
    output = tmp_path / "tuck-top.svg"

    result = runner.invoke(
        main,
        [
            "generate",
            "--style",
            "tuck-top",
            "--length",
            "6",
            "--width",
            "2",
            "--height",
            "3.5",
            "--output",
            str(output),
        ],
    )

    assert result.exit_code == 0
    assert output.exists()
