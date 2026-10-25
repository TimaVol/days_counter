export const STORAGE_KEY = "days_counters";
export const LEGACY_COOKIE = "days_counter_date";

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // ponytail: fine for local ids; upgrade to crypto.randomUUID if needed
  return "c_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

export function createCounter(overrides = {}) {
  return {
    id: overrides.id ?? newId(),
    title: overrides.title ?? "",
    date: overrides.date ?? null,
  };
}

export function addCounter(list) {
  return [...list, createCounter()];
}

export function removeCounter(list, id) {
  if (list.length <= 1) return list;
  return list.filter((c) => c.id !== id);
}

export function updateCounter(list, id, patch) {
  return list.map((c) => (c.id === id ? { ...c, ...patch, id: c.id } : c));
}

function isValidCounter(item) {
  return (
    item &&
    typeof item === "object" &&
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    (item.date === null || typeof item.date === "string")
  );
}

export function loadCounters({ getItem, getCookie }) {
  const raw = getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(isValidCounter)) {
        return parsed;
      }
    } catch {
      // fall through to migration / default
    }
  }

  const legacy = getCookie(LEGACY_COOKIE);
  if (legacy) {
    return [createCounter({ date: legacy })];
  }

  return [createCounter()];
}

export function saveCounters(list, { setItem }) {
  setItem(STORAGE_KEY, JSON.stringify(list));
}
