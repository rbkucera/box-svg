import type { BoxRequest, Dieline } from "../models";
import { generateMailerDieline } from "./mailer";

const GENERATORS: Record<string, (req: BoxRequest) => Dieline> = {
  mailer: generateMailerDieline,
};

export function generateDieline(request: BoxRequest): Dieline {
  const generator = GENERATORS[request.style];
  if (!generator) {
    throw new Error(`No generator for style: ${request.style}`);
  }
  return generator(request);
}
