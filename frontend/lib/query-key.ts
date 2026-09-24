/**
 * TanStack Query hashes query keys with JSON.stringify, which throws on bigint.
 * Contract arguments must stay bigint for the RPC call, but their cache-key copy
 * needs a stable JSON-safe representation.
 */
export function toQueryKeyValue(value: unknown): unknown {
  if (typeof value === "bigint") return { $bigint: value.toString() };
  if (Array.isArray(value)) return value.map(toQueryKeyValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, toQueryKeyValue(nested)]),
    );
  }
  return value;
}
