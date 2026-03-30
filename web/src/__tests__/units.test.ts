import { describe, it, expect } from "vitest";
import { toInches, fromInches } from "../core/units";

describe("toInches", () => {
  it("returns identity for inches", () => {
    expect(toInches(5.0, "in")).toBe(5.0);
  });

  it("converts mm to inches", () => {
    expect(toInches(25.4, "mm")).toBeCloseTo(1.0);
  });

  it("throws for unsupported units", () => {
    expect(() => toInches(1.0, "cm")).toThrow("Unsupported unit");
  });
});

describe("fromInches", () => {
  it("returns identity for inches", () => {
    expect(fromInches(3.0, "in")).toBe(3.0);
  });

  it("converts inches to mm", () => {
    expect(fromInches(1.0, "mm")).toBeCloseTo(25.4);
  });

  it("roundtrips mm", () => {
    expect(fromInches(toInches(12.7, "mm"), "mm")).toBeCloseTo(12.7);
  });
});
