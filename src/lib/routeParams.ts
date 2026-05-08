const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const POSITIVE_INT_RE = /^[1-9]\d*$/;

export function normalizeUuidParam(value: string | undefined): string | null {
  const normalized = (value || "").trim();
  return UUID_RE.test(normalized) ? normalized : null;
}

export function normalizePositiveIntParam(value: string | undefined): string | null {
  const normalized = (value || "").trim();
  return POSITIVE_INT_RE.test(normalized) ? normalized : null;
}
