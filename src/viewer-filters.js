function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

export function parseCsvParam(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function normalizeBaseUrlValue(value) {
  if (!value) return null;
  try {
    const normalized = String(value).trim();
    if (!normalized) return null;
    const url = normalized.includes('://')
      ? new URL(normalized)
      : new URL(`http://${normalized}`);
    return url.hostname;
  } catch {
    return null;
  }
}

export function normalizeBaseUrlFilters(values) {
  const items = toArray(values)
    .map((entry) => normalizeBaseUrlValue(entry))
    .filter(Boolean);
  return Array.from(new Set(items));
}

export function normalizeMethodFilters(values) {
  const items = toArray(values)
    .map((entry) => String(entry).trim().toUpperCase())
    .filter(Boolean);
  return Array.from(new Set(items));
}

export function filterLogs(logs, { baseUrls, methods } = {}) {
  const baseUrlFilters = normalizeBaseUrlFilters(baseUrls);
  const methodFilters = normalizeMethodFilters(methods);

  return (logs || []).filter((log) => {
    if (baseUrlFilters.length) {
      const hostname = normalizeBaseUrlValue(log?.request?.url);
      if (!hostname || !baseUrlFilters.includes(hostname)) {
        return false;
      }
    }
    if (methodFilters.length) {
      const method = String(log?.request?.method || '').toUpperCase();
      if (!methodFilters.includes(method)) {
        return false;
      }
    }
    return true;
  });
}
