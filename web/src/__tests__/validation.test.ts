import { describe, it, expect } from "vitest";
import type { BoxRequest } from "../core/models";
import { validateRequest, warnUnusual } from "../core/validation";

function makeRequest(overrides: Partial<BoxRequest> = {}): BoxRequest {
  return {
    style: "mailer",
    length: 6.0,
    width: 2.0,
    height: 3.5,
    units: "in",
    material: "corrugated",
    lid: "over",
    ...overrides,
  };
}

describe("validateRequest", () => {
  it("returns no errors for valid request", () => {
    expect(validateRequest(makeRequest())).toEqual([]);
  });

  it("rejects zero length", () => {
    const errors = validateRequest(makeRequest({ length: 0 }));
    expect(errors.some((e) => e.includes("length"))).toBe(true);
  });

  it("rejects negative width", () => {
    const errors = validateRequest(makeRequest({ width: -1 }));
    expect(errors.some((e) => e.includes("width"))).toBe(true);
  });

  it("rejects negative thickness", () => {
    const errors = validateRequest(makeRequest({ thickness: -0.1 }));
    expect(errors.some((e) => e.includes("thickness"))).toBe(true);
  });

  it("rejects negative kerf", () => {
    const errors = validateRequest(makeRequest({ kerf: -0.01 }));
    expect(errors.some((e) => e.includes("kerf"))).toBe(true);
  });

  it("accepts zero kerf", () => {
    expect(validateRequest(makeRequest({ kerf: 0 }))).toEqual([]);
  });
});

describe("warnUnusual", () => {
  it("warns on extreme aspect ratio", () => {
    const warnings = warnUnusual(makeRequest({ length: 100, width: 1, height: 1 }));
    expect(warnings.some((w) => w.toLowerCase().includes("aspect ratio"))).toBe(true);
  });

  it("warns on high kerf", () => {
    const warnings = warnUnusual(makeRequest({ kerf: 0.1 }));
    expect(warnings.some((w) => w.toLowerCase().includes("kerf"))).toBe(true);
  });

  it("no warnings for normal inputs", () => {
    expect(warnUnusual(makeRequest())).toEqual([]);
  });
});
