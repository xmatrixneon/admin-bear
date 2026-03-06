import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/* Tailwind helper */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/* Convert unknown numeric types safely */
export function toNumber(value: any): number {
  if (value === null || value === undefined) return 0

  if (typeof value === "number") return value
  if (typeof value === "string") return Number(value)
  if (typeof value === "bigint") return Number(value)

  if (typeof value === "object" && typeof value?.toNumber === "function") {
    return value.toNumber()
  }

  const parsed = Number(value)
  return isNaN(parsed) ? 0 : parsed
}

/* Currency formatter */
export function formatCurrency(
  value: number | string | bigint | { toNumber?: () => number } | null | undefined,
  currency: string = "INR"
) {
  const num = toNumber(value)

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(num)
}

/* Date formatter */
export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d)
}

/* Date + Time formatter */
export function formatDateTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}