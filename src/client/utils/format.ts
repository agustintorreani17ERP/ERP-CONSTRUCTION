export function formatMoney(
  amount: number | string | undefined | null,
  currency: "PYG" | "USD" = "PYG"
): string {
  if (amount === undefined || amount === null) return currency === "PYG" ? "0 ₲" : "$ 0.00";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return currency === "PYG" ? "0 ₲" : "$ 0.00";

  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  }

  return (
    new Intl.NumberFormat("es-PY", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(Math.round(num)) + " ₲"
  );
}

export function formatCompactMoney(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return "0 ₲";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0 ₲";

  if (Math.abs(num) >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(2).replace(/\.00$/, "") + " B ₲";
  }
  if (Math.abs(num) >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + " M ₲";
  }
  if (Math.abs(num) >= 1_000) {
    return (num / 1_000).toFixed(0) + " k ₲";
  }
  return formatMoney(num);
}

export function formatPercent(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return "0.0%";
  return `${value.toFixed(1)}%`;
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("es-PY", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("es-PY", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}
