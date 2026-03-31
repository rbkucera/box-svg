import { describe, it, expect } from "vitest";
import type { BoxRequest } from "../core/models";
import { generateTuckTopDieline } from "../core/generators/tuckTop";

function makeRequest(overrides: Partial<BoxRequest> = {}): BoxRequest {
  return {
    style: "tuck-top",
    length: 6.0,
    width: 2.0,
    height: 3.5,
    units: "in",
    material: "corrugated",
    lid: "inside",
    ...overrides,
  };
}

describe("generateTuckTopDieline", () => {
  it("returns a dieline with elements", () => {
    const result = generateTuckTopDieline(makeRequest());
    expect(result.elements.length).toBeGreaterThan(0);
  });

  it("has correct dimensions", () => {
    const T = 0.125;
    const result = generateTuckTopDieline(makeRequest());
    const glueW = Math.min(2.0 / 2, Math.max(2.0 / 4, T * 4));
    const expectedW = glueW + 2 * 6.0 + 2 * 2.0;
    const expectedH = 2.0 / 2 + 2.0 + 3.5 + 2.0 + 2.0 / 2;
    expect(result.width).toBeCloseTo(expectedW);
    expect(result.height).toBeCloseTo(expectedH);
  });

  it("has cut and score elements", () => {
    const result = generateTuckTopDieline(makeRequest());
    const kinds = new Set(result.elements.map((e) => e.kind));
    expect(kinds.has("cut")).toBe(true);
    expect(kinds.has("score")).toBe(true);
  });

  it("all elements within bounds", () => {
    const result = generateTuckTopDieline(makeRequest());
    for (const el of result.elements) {
      expect(el.x1).toBeGreaterThanOrEqual(-0.001);
      expect(el.x2).toBeLessThanOrEqual(result.width + 0.001);
      expect(el.y1).toBeGreaterThanOrEqual(-0.001);
      expect(el.y2).toBeLessThanOrEqual(result.height + 0.001);
    }
  });

  it("kerf expands dieline", () => {
    const noKerf = generateTuckTopDieline(makeRequest({ kerf: 0 }));
    const withKerf = generateTuckTopDieline(makeRequest({ kerf: 0.02 }));
    expect(withKerf.width).toBeCloseTo(noKerf.width + 0.02);
    expect(withKerf.height).toBeCloseTo(noKerf.height + 0.02);
  });
});
