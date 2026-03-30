import { describe, it, expect } from "vitest";
import type { BoxRequest } from "../core/models";
import { generateMailerDieline } from "../core/generators/mailer";

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

describe("generateMailerDieline", () => {
  it("returns a dieline with elements", () => {
    const result = generateMailerDieline(makeRequest());
    expect(result.elements.length).toBeGreaterThan(0);
  });

  it("has correct dimensions", () => {
    const T = 0.125;
    const result = generateMailerDieline(makeRequest());
    const expectedH = 3.5 / 2 + (2.0 + T / 2) + 3.5 + 2.0 + 3.5;
    expect(result.height).toBeCloseTo(expectedH);
    const expectedW = Math.max(6.0 + 2.0, 6.0 + 3.5 + T);
    expect(result.width).toBeCloseTo(expectedW);
  });

  it("has cut and score elements", () => {
    const result = generateMailerDieline(makeRequest());
    const kinds = new Set(result.elements.map((e) => e.kind));
    expect(kinds.has("cut")).toBe(true);
    expect(kinds.has("score")).toBe(true);
  });

  it("all elements within bounds", () => {
    const result = generateMailerDieline(makeRequest());
    for (const el of result.elements) {
      expect(el.x1).toBeGreaterThanOrEqual(-0.001);
      expect(el.x2).toBeLessThanOrEqual(result.width + 0.001);
      expect(el.y1).toBeGreaterThanOrEqual(-0.001);
      expect(el.y2).toBeLessThanOrEqual(result.height + 0.001);
    }
  });

  it("thickness affects output", () => {
    const thin = generateMailerDieline(makeRequest({ thickness: 0.05 }));
    const thick = generateMailerDieline(makeRequest({ thickness: 0.25 }));
    expect(thin.width).not.toEqual(thick.width);
  });

  it("kerf expands dieline", () => {
    const noKerf = generateMailerDieline(makeRequest({ kerf: 0 }));
    const withKerf = generateMailerDieline(makeRequest({ kerf: 0.02 }));
    expect(withKerf.width).toBeCloseTo(noKerf.width + 0.02);
    expect(withKerf.height).toBeCloseTo(noKerf.height + 0.02);
  });

  it("lid inside produces shorter top panel", () => {
    const over = generateMailerDieline(makeRequest({ lid: "over" }));
    const inside = generateMailerDieline(makeRequest({ lid: "inside" }));
    expect(inside.height).toBeCloseTo(over.height - 0.125);
  });

  it("cut path is continuous (no breaks)", () => {
    const result = generateMailerDieline(makeRequest());
    const cuts = result.elements.filter((e) => e.kind === "cut");
    let breaks = 0;
    for (let i = 0; i < cuts.length - 1; i++) {
      const gap = Math.hypot(cuts[i].x2 - cuts[i + 1].x1, cuts[i].y2 - cuts[i + 1].y1);
      if (gap > 0.001) breaks++;
    }
    expect(breaks).toBe(0);
  });
});
