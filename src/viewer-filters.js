function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

function normalizeAliasValue(value) {
  if (!value) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  return normalized.toLowerCase();
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

export function normalizeAliasFilters(values) {
  const items = toArray(values)
    .map((entry) => normalizeAliasValue(entry))
    .filter(Boolean);
  return Array.from(new Set(items));
}

export function filterLogs(logs, { baseUrls, methods, aliases, aliasHostMap } = {}) {
  const baseUrlFilters = normalizeBaseUrlFilters(baseUrls);
  const expandedBaseUrlFilters = expandBaseUrlFilters(baseUrlFilters, aliasHostMap);
  const methodFilters = normalizeMethodFilters(methods);
  const aliasFilters = normalizeAliasFilters(aliases);
  const normalizedAliasHostMap = normalizeAliasHostMap(aliasHostMap);

  return (logs || []).filter((log) => {
    if (expandedBaseUrlFilters.length) {
      const hostname = normalizeBaseUrlValue(log?.request?.url);
      if (!hostname || !expandedBaseUrlFilters.includes(hostname)) {
        return false;
      }
    }
    if (methodFilters.length) {
      const method = String(log?.request?.method || '').toUpperCase();
      if (!methodFilters.includes(method)) {
        return false;
      }
    }
    if (aliasFilters.length && !matchesAliasFilters(log, aliasFilters, normalizedAliasHostMap)) {
      return false;
    }
    return true;
  });
}

function expandBaseUrlFilters(baseUrlFilters, aliasHostMap) {
  const expanded = new Set(baseUrlFilters);
  if (!aliasHostMap || typeof aliasHostMap !== 'object') {
    return Array.from(expanded);
  }
  for (const value of baseUrlFilters) {
    const aliasHost = aliasHostMap[String(value).toLowerCase()];
    if (aliasHost) {
      expanded.add(aliasHost);
    }
  }
  return Array.from(expanded);
}

function normalizeAliasHostMap(aliasHostMap) {
  if (!aliasHostMap || typeof aliasHostMap !== 'object') {
    return {};
  }
  const normalized = {};
  for (const [alias, host] of Object.entries(aliasHostMap)) {
    const aliasKey = normalizeAliasValue(alias);
    const hostValue = normalizeBaseUrlValue(host) || normalizeAliasValue(host);
    if (!aliasKey || !hostValue) continue;
    normalized[aliasKey] = hostValue;
  }
  return normalized;
}

function matchesAliasFilters(log, aliasFilters, aliasHostMap) {
  const provider = normalizeAliasValue(log?.provider);
  const alias = normalizeAliasValue(log?.alias);
  const hostname = normalizeBaseUrlValue(log?.request?.url);

  for (const filterValue of aliasFilters) {
    if (provider && filterValue === provider) {
      return true;
    }
    if (alias && filterValue === alias) {
      return true;
    }
    const mappedHost = aliasHostMap[filterValue];
    if (mappedHost && hostname && mappedHost === hostname) {
      return true;
    }
  }

  return false;
}
