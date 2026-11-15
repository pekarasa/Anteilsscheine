import type { DecimalValue } from "../model/types";
import { texts } from "../ui/texts";

const decimalPattern = /^(-?)(\d+)(?:\.(\d+))?$/;

export function parseDecimal(text: string): DecimalValue {
  const trimmed = text.trim();
  const match = decimalPattern.exec(trimmed);
  if (!match) {
    throw new Error(texts.errors.invalidDecimal(text));
  }
  const sign = match[1] === "-" ? -1n : 1n;
  const fraction = match[3] ?? "";
  const digits = BigInt((match[2] ?? "") + fraction);
  return { text: trimmed, units: sign * digits, scale: fraction.length };
}

/**
 * Multiplies an integer with a decimal value and truncates towards zero,
 * like the C# cast (int)(decimal). Uses exact integer arithmetic.
 */
export function multiplyTruncated(count: number, value: DecimalValue): number {
  const product = BigInt(count) * value.units;
  const divisor = 10n ** BigInt(value.scale);
  return Number(product / divisor);
}
