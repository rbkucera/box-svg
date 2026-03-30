export const MM_PER_INCH = 25.4;

export function toInches(value: number, units: string): number {
  if (units === "in") return value;
  if (units === "mm") return value / MM_PER_INCH;
  throw new Error(`Unsupported unit: ${units}`);
}

export function fromInches(value: number, units: string): number {
  if (units === "in") return value;
  if (units === "mm") return value * MM_PER_INCH;
  throw new Error(`Unsupported unit: ${units}`);
}
