import { Decimal } from "@prisma/client/runtime/library";

export type MoneyLike = Decimal | number | string;

export function toDecimal(value: MoneyLike): Decimal {
  return value instanceof Decimal ? value : new Decimal(value);
}

export function moneyNumber(value: MoneyLike): number {
  return toDecimal(value).toNumber();
}

export function assertPositive(value: MoneyLike, field: string): Decimal {
  const n = toDecimal(value);
  if (n.lte(0)) {
    throw new Error(`${field} debe ser mayor a cero`);
  }
  return n;
}
