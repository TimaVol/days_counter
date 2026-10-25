import { describe, expect, it } from "vitest";
import {
  STORAGE_KEY,
  addCounter,
  createCounter,
  loadCounters,
  removeCounter,
  saveCounters,
  updateCounter,
} from "./counters.js";

describe("createCounter", () => {
  it("creates a counter with id, empty title, and null date", () => {
    const c = createCounter();
    expect(c.id).toEqual(expect.any(String));
    expect(c.id.length).toBeGreaterThan(0);
    expect(c.title).toBe("");
    expect(c.date).toBeNull();
  });

  it("accepts title and date overrides", () => {
    const c = createCounter({ title: "Quit", date: "2024-01-15" });
    expect(c.title).toBe("Quit");
    expect(c.date).toBe("2024-01-15");
  });
});

describe("addCounter", () => {
  it("appends a new empty counter", () => {
    const list = [createCounter({ id: "a", date: "2024-01-01" })];
    const next = addCounter(list);
    expect(next).toHaveLength(2);
    expect(next[0].id).toBe("a");
    expect(next[1].date).toBeNull();
    expect(next[1].id).not.toBe("a");
  });
});

describe("removeCounter", () => {
  it("removes by id when more than one remains", () => {
    const list = [
      createCounter({ id: "a", date: "2024-01-01" }),
      createCounter({ id: "b", date: "2024-02-01" }),
    ];
    expect(removeCounter(list, "a").map((c) => c.id)).toEqual(["b"]);
  });

  it("keeps the last counter instead of emptying the list", () => {
    const list = [createCounter({ id: "only", date: "2024-01-01" })];
    expect(removeCounter(list, "only")).toEqual(list);
  });
});

describe("updateCounter", () => {
  it("patches title and date for matching id", () => {
    const list = [
      createCounter({ id: "a", title: "", date: null }),
      createCounter({ id: "b", title: "B", date: "2024-02-01" }),
    ];
    const next = updateCounter(list, "a", {
      title: "A",
      date: "2024-01-15",
    });
    expect(next[0]).toEqual({ id: "a", title: "A", date: "2024-01-15" });
    expect(next[1]).toEqual(list[1]);
  });
});

describe("loadCounters / saveCounters", () => {
  it("returns saved list from storage", () => {
    const stored = [
      { id: "x", title: "X", date: "2023-06-01" },
      { id: "y", title: "", date: null },
    ];
    const store = { [STORAGE_KEY]: JSON.stringify(stored) };
    const list = loadCounters({
      getItem: (k) => store[k] ?? null,
      getCookie: () => null,
    });
    expect(list).toEqual(stored);
  });

  it("migrates legacy cookie into a single counter when storage empty", () => {
    const list = loadCounters({
      getItem: () => null,
      getCookie: (name) =>
        name === "days_counter_date" ? "2024-03-10" : null,
    });
    expect(list).toHaveLength(1);
    expect(list[0].date).toBe("2024-03-10");
    expect(list[0].title).toBe("");
  });

  it("starts with one empty counter when nothing saved", () => {
    const list = loadCounters({
      getItem: () => null,
      getCookie: () => null,
    });
    expect(list).toHaveLength(1);
    expect(list[0].date).toBeNull();
  });

  it("persists list under storage key", () => {
    const store = {};
    const list = [createCounter({ id: "z", title: "Z", date: "2020-01-01" })];
    saveCounters(list, {
      setItem: (k, v) => {
        store[k] = v;
      },
    });
    expect(JSON.parse(store[STORAGE_KEY])).toEqual(list);
  });
});
